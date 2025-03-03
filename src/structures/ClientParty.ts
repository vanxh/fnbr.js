import Collection from '@discordjs/collection';
import Endpoints from '../../resources/Endpoints';
import {
  PartyData, PartyPrivacy, Playlist, Schema,
} from '../../resources/structs';
import Client from '../client/Client';
import FriendNotFoundError from '../exceptions/FriendNotFoundError';
import PartyAlreadyJoinedError from '../exceptions/PartyAlreadyJoinedError';
import PartyMaxSizeReachedError from '../exceptions/PartyMaxSizeReachedError';
import PartyMemberNotFoundError from '../exceptions/PartyMemberNotFoundError';
import PartyPermissionError from '../exceptions/PartyPermissionError';
import AsyncQueue from '../util/AsyncQueue';
import ClientPartyMember from './ClientPartyMember';
import ClientPartyMeta from './ClientPartyMeta';
import ClientUser from './ClientUser';
import Party from './Party';
import PartyChat from './PartyChat';
import PartyMemberConfirmation from './PartyMemberConfirmation';
import SentPartyInvitation from './SentPartyInvitation';

/**
 * Represents a party that the client is a member of
 */
class ClientParty extends Party {
  /**
   * The party patch queue
   */
  private patchQueue: AsyncQueue;

  /**
   * The party text chat
   */
  public chat: PartyChat;

  /**
   * The party's meta
   */
  public meta: ClientPartyMeta;

  /**
   * The hidden member ids
   */
  public hiddenMemberIds: string[];

  /**
   * The pending member confirmations
   */
  public pendingMemberConfirmations: Collection<string, PartyMemberConfirmation>;

  /**
   * @param client The main client
   * @param data The party's data
   */
  constructor(client: Client, data: PartyData) {
    super(client, data);
    this.hiddenMemberIds = [];
    this.pendingMemberConfirmations = new Collection();

    this.patchQueue = new AsyncQueue();
    this.chat = new PartyChat(this.client, this);
    this.meta = new ClientPartyMeta(this, data.meta);
  }

  /**
   * Returns the client's party member
   */
  public get me() {
    return this.members.get(this.client.user?.id as string) as ClientPartyMember;
  }

  /**
   * Whether the party is private
   */
  public get isPrivate() {
    return this.config.privacy.partyType === 'Private';
  }

  /**
   * Leaves this party
   * @param createNew Whether a new party should be created
   * @throws {EpicgamesAPIError}
   */
  public async leave(createNew = true) {
    return this.client.leaveParty(createNew);
  }

  /**
   * Sends a party patch to Epicgames' servers
   * @param updated The updated schema
   * @param deleted The deleted schema keys
   * @throws {PartyPermissionError} You're not the leader of this party
   * @throws {EpicgamesAPIError}
   */
  public async sendPatch(updated: Schema, deleted: string[] = []): Promise<void> {
    await this.patchQueue.wait();

    const patch = await this.client.http.sendEpicgamesRequest(true, 'PATCH', `${Endpoints.BR_PARTY}/parties/${this.id}`, 'fortnite', {
      'Content-Type': 'application/json',
    }, {
      config: {
        join_confirmation: this.config.joinConfirmation,
        joinability: this.config.joinability,
        max_size: this.config.maxSize,
        discoverability: this.config.discoverability,
      },
      meta: {
        delete: deleted,
        update: updated || this.meta.schema,
      },
      party_state_overridden: {},
      party_privacy_type: this.config.joinability,
      party_type: this.config.type,
      party_sub_type: this.config.subType,
      max_number_of_members: this.config.maxSize,
      invite_ttl_seconds: this.config.inviteTtl,
      revision: this.revision,
    });

    if (patch.error) {
      if (patch.error.code === 'errors.com.epicgames.social.party.stale_revision') {
        this.revision = parseInt(patch.error.messageVars[1], 10);
        this.patchQueue.shift();
        return this.sendPatch(updated);
      }

      this.patchQueue.shift();

      if (patch.error.code === 'errors.com.epicgames.social.party.party_change_forbidden') {
        throw new PartyPermissionError();
      }

      throw patch.error;
    }

    this.revision += 1;
    this.patchQueue.shift();

    return undefined;
  }

  /**
   * Kicks a member from this party
   * @param member The member that should be kicked
   * @throws {PartyPermissionError} The client is not the leader of the party
   * @throws {PartyMemberNotFoundError} The party member wasn't found
   * @throws {EpicgamesAPIError}
   */
  public async kick(member: string) {
    if (!this.me.isLeader) throw new PartyPermissionError();

    const partyMember = this.members.find((m) => m.displayName === member || m.id === member);
    if (!partyMember) throw new PartyMemberNotFoundError(member);

    const kick = await this.client.http.sendEpicgamesRequest(true, 'DELETE',
      `${Endpoints.BR_PARTY}/parties/${this.id}/members/${partyMember.id}`, 'fortnite');
    if (kick.error) {
      if (kick.error.code === 'errors.com.epicgames.social.party.party_change_forbidden') throw new PartyPermissionError();
      throw kick.error;
    }
  }

  /**
   * Sends a party invitation to a friend
   * @param friend The friend that will receive the invitation
   * @throws {FriendNotFoundError} The user is not friends with the client
   * @throws {PartyAlreadyJoinedError} The user is already a member of this party
   * @throws {PartyMaxSizeReachedError} The party reached its max size
   * @throws {EpicgamesAPIError}
   */
  public async invite(friend: string) {
    const resolvedFriend = this.client.friends.find((f) => f.id === friend || f.displayName === friend);
    if (!resolvedFriend) throw new FriendNotFoundError(friend);

    if (this.members.has(resolvedFriend.id)) throw new PartyAlreadyJoinedError();
    if (this.size === this.maxSize) throw new PartyMaxSizeReachedError();

    let invite;
    if (this.isPrivate) {
      invite = await this.client.http.sendEpicgamesRequest(true, 'POST',
        `${Endpoints.BR_PARTY}/parties/${this.id}/invites/${resolvedFriend.id}?sendPing=true`, 'fortnite', {
          'Content-Type': 'application/json',
        }, {
          'urn:epic:cfg:build-id_s': this.client.config.partyBuildId,
          'urn:epic:conn:platform_s': this.client.config.platform,
          'urn:epic:conn:type_s': 'game',
          'urn:epic:invite:platformdata_s': '',
          'urn:epic:member:dn_s': this.client.user?.displayName,
        });
    } else {
      invite = await this.client.http.sendEpicgamesRequest(true, 'POST',
        `${Endpoints.BR_PARTY}/user/${resolvedFriend.id}/pings/${this.client.user?.id}`, 'fortnite', {
          'Content-Type': 'application/json',
        }, {
          'urn:epic:invite:platformdata_s': '',
        });
    }
    if (invite.error) throw invite.error;

    return new SentPartyInvitation(this.client, this, this.client.user as ClientUser, resolvedFriend, invite);
  }

  /**
   * Refreshes the member positions of this party
   * @throws {PartyPermissionError} The client is not the leader of the party
   * @throws {EpicgamesAPIError}
   */
  public async refreshSquadAssignments() {
    if (!this.me.isLeader) throw new PartyPermissionError();

    await this.sendPatch({
      'Default:RawSquadAssignments_j': this.meta.refreshSquadAssignments(),
    });
  }

  /**
   * Sends a message to the party chat
   * @param content The message that will be sent
   */
  public async sendMessage(content: string) {
    return this.chat.send(content);
  }

  /**
   * Updates this party's privacy settings
   * @param privacy The updated party privacy
   * @param sendPatch Whether the updated privacy should be sent to epic's servers
   * @throws {PartyPermissionError} The client is not the leader of the party
   * @throws {EpicgamesAPIError}
   */
  public async setPrivacy(privacy: PartyPrivacy, sendPatch = true) {
    if (!this.me.isLeader) throw new PartyPermissionError();

    const updated: Schema = {};
    const deleted: string[] = [];

    const privacyMeta = this.meta.get('Default:PrivacySettings_j');
    if (privacyMeta) {
      updated['Default:PrivacySettings_j'] = this.meta.set('Default:PrivacySettings_j', {
        PrivacySettings: {
          ...privacyMeta.PrivacySettings,
          partyType: privacy.partyType,
          bOnlyLeaderFriendsCanJoin: privacy.onlyLeaderFriendsCanJoin,
          partyInviteRestriction: privacy.inviteRestriction,
        },
      });
    }

    updated['urn:epic:cfg:presence-perm_s'] = this.meta.set('urn:epic:cfg:presence-perm_s', privacy.presencePermission);
    updated['urn:epic:cfg:accepting-members_b'] = this.meta.set('urn:epic:cfg:accepting-members_b', privacy.acceptingMembers);
    updated['urn:epic:cfg:invite-perm_s'] = this.meta.set('urn:epic:cfg:invite-perm_s', privacy.invitePermission);

    if (privacy.partyType === 'Private') {
      deleted.push('urn:epic:cfg:not-accepting-members');
      updated['urn:epic:cfg:not-accepting-members-reason_i'] = this.meta.set('urn:epic:cfg:not-accepting-members-reason_i', 7);
      this.config.discoverability = 'INVITED_ONLY';
      this.config.joinability = 'INVITE_AND_FORMER';
    } else {
      deleted.push('urn:epic:cfg:not-accepting-members-reason_i');
      this.config.discoverability = 'ALL';
      this.config.joinability = 'OPEN';
    }

    this.meta.remove(deleted);

    if (sendPatch) await this.sendPatch(updated, deleted);
    this.config.privacy = {
      ...this.config.privacy,
      ...privacy,
    };

    return { updated, deleted };
  }

  /**
   * Sets this party's custom matchmaking key
   * @param key The custom matchmaking key
   * @throws {PartyPermissionError} The client is not the leader of the party
   * @throws {EpicgamesAPIError}
   */
  public async setCustomMatchmakingKey(key?: string) {
    if (!this.me.isLeader) throw new PartyPermissionError();

    await this.sendPatch({
      'Default:CustomMatchKey_s': this.meta.set('Default:CustomMatchKey_s', key || ''),
    });
  }

  /**
   * Promotes a party member
   * @param member The member that should be promoted
   * @throws {PartyPermissionError} The client is not the leader of the party
   * @throws {PartyMemberNotFoundError} The party member wasn't found
   * @throws {EpicgamesAPIError}
   */
  public async promote(member: string) {
    if (!this.me.isLeader) throw new PartyPermissionError();

    const partyMember = this.members.find((m) => m.displayName === member || m.id === member);
    if (!partyMember) throw new PartyMemberNotFoundError(member);

    const promote = await this.client.http.sendEpicgamesRequest(true, 'POST',
      `${Endpoints.BR_PARTY}/parties/${this.id}/members/${partyMember.id}/promote`, 'fortnite');
    if (promote.error) {
      if (promote.error.code === 'errors.com.epicgames.social.party.party_change_forbidden') throw new PartyPermissionError();
      throw promote.error;
    }
  }

  /**
   * Hides / Unhides a single party member
   * @param member The member that should be hidden
   * @param hide Whether the member should be hidden
   * @throws {PartyPermissionError} The client is not the leader of the party
   * @throws {PartyMemberNotFoundError} The party member wasn't found
   * @throws {EpicgamesAPIError}
   */
  public async hideMember(member: string, hide = true) {
    if (!this.me.isLeader) throw new PartyPermissionError();

    const partyMember = this.members.find((m) => m.displayName === member || m.id === member);
    if (!partyMember) throw new PartyMemberNotFoundError(member);

    if (hide) {
      this.hiddenMemberIds.push(partyMember.id);
    } else {
      this.hiddenMemberIds.splice(this.hiddenMemberIds.findIndex((i) => i === partyMember.id), 1);
    }

    await this.refreshSquadAssignments();
  }

  /**
   * Hides / Unhides all party members except for the client
   * @param hide Whether all members should be hidden
   * @throws {PartyPermissionError} The client is not the leader of the party
   * @throws {EpicgamesAPIError}
   */
  public async hideMembers(hide = true) {
    if (!this.me.isLeader) throw new PartyPermissionError();

    if (hide) {
      this.hiddenMemberIds = this.members.filter((m) => m.id !== this.me.id).map((m) => m.id);
    } else {
      this.hiddenMemberIds = [];
    }

    await this.refreshSquadAssignments();
  }

  /**
   * Updates the party's playlist
   * @param playlist The new playlist
   * @throws {PartyPermissionError} The client is not the leader of the party
   * @throws {EpicgamesAPIError}
   */
  public async setPlaylist(playlist: Playlist) {
    if (!this.me.isLeader) throw new PartyPermissionError();

    let data = this.meta.get('Default:PlaylistData_j');
    data = this.meta.set('Default:PlaylistData_j', {
      ...data,
      PlaylistData: {
        ...data.PlaylistData,
        ...playlist,
      },
    });

    await this.sendPatch({
      'Default:PlaylistData_j': data,
    });
  }

  /**
   * Updates the squad fill status of this party
   * @param fill Whether fill is enable or not
   * @throws {PartyPermissionError} The client is not the leader of the party
   * @throws {EpicgamesAPIError}
   */
  public async setSquadFill(fill = true) {
    if (!this.me.isLeader) throw new PartyPermissionError();

    await this.sendPatch({
      'Default:AthenaSquadFill_b': this.meta.set('Default:AthenaSquadFill_b', fill),
    });
  }

  /**
   * Updates the party's max member count
   * @param maxSize The new party max size (1-16)
   * @throws {PartyPermissionError} The client is not the leader of the party
   * @throws {RangeError} The new max member size must be between 1 and 16 (inclusive) and more than the current member count
   * @throws {EpicgamesAPIError}
   */
  public async setMaxSize(maxSize: number) {
    if (!this.me.isLeader) throw new PartyPermissionError();
    if (maxSize < 1 || maxSize > 16) throw new RangeError('The new max member size must be between 1 and 16 (inclusive)');

    if (maxSize < this.size) throw new RangeError('The new max member size must be higher than the current member count');

    this.config.maxSize = maxSize;
    await this.sendPatch(this.meta.schema);
  }
}

export default ClientParty;
