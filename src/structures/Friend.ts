import Client from '../client/Client';
import User from './User';
import { FriendConnections, FriendData } from '../../resources/structs';
import FriendPresence from './FriendPresence';
import PresenceParty from './PresenceParty';

/**
 * Represents a friend
 */
class Friend extends User {
  /**
   * The friend's console connections
   */
  public connections: FriendConnections;

  /**
   * The mutual friends count.
   * Can be undefined if the friend was not friends with the client before startup
   */
  public mutualFriends?: number;

  /**
   * Whether you favorited this friend
   */
  public favorite: boolean;

  /**
   * The date when the friendship was created
   */
  public createdAt: Date;

  /**
   * The note for this friend
   */
  public note?: string;

  /**
   * The alias for this friend
   */
  public alias?: string;

  /**
   * The last recieved presence of this friend
   */
  public presence?: FriendPresence;

  /**
   * The friend's current party
   */
  public party?: PresenceParty;

  /**
   * Timestamp when the last presence was recieved from this friend.
   * WARNING: Do not rely on this, it's set to undefined once this friend goes offline.
   * Use {@link FriendPresence#recievedAt} instead
   */
  public lastAvailableTimestamp?: number;

  /**
   * @param client The main client
   * @param data The friend data
   */
  constructor(client: Client, data: FriendData) {
    super(client, data);

    this.connections = data.connections || {};
    this.mutualFriends = data.mutual;
    this.favorite = data.favorite;
    this.createdAt = new Date(data.created);
    this.note = data.note;
    this.alias = data.alias;
    this.presence = undefined;
    this.party = undefined;
    this.lastAvailableTimestamp = undefined;
  }

  /**
   * Whether a user is online or not
   * @readonly
   */
  public get isOnline() {
    return !!this.lastAvailableTimestamp && Date.now() - this.lastAvailableTimestamp < 300000;
  }

  /**
   * Whether the client can join this friend's party or not
   * May be slighly inaccurate as it uses the last received presence
   * @readonly
   */
  public get isJoinable() {
    if (!this.isOnline) return false;
    return !!this.presence?.isJoinable;
  }

  /**
   * Removes this friend
   * @throws {UserNotFoundError} The user wasn't found
   * @throws {FriendNotFoundError} The user is not friends with the client
   * @throws {EpicgamesAPIError}
   */
  public async remove() {
    return this.client.removeFriend(this.id);
  }

  /**
   * Sends a message to this friend
   * @param content The message that will be sent
   * @throws {FriendNotFoundError} The user is not friends with the client
   */
  public sendMessage(content: string) {
    return this.client.sendFriendMessage(this.id, content);
  }

  /**
   * Sends a party join request to this friend.
   * When the friend confirms this, a party invite will be sent to the client
   * @throws {EpicgamesAPIError}
   */
  public async sendJoinRequest() {
    return this.client.sendRequestToJoin(this.id);
  }

  /**
   * Sends a party invitation to this friend
   * @throws {FriendNotFoundError} The user is not friends with the client
   * @throws {PartyAlreadyJoinedError} The user is already a member of this party
   * @throws {PartyMaxSizeReachedError} The party reached its max size
   * @throws {EpicgamesAPIError}
   */
  public async invite() {
    return this.client.invite(this.id);
  }
}

export default Friend;
