import Client from '../client/Client';
import Base from '../client/Base';
import UserNotFoundError from '../exceptions/UserNotFoundError';
import { ExternalAuths, UserData } from '../../resources/structs';

/**
 * Represents a user
 */
class User extends Base {
  /**
   * The user's display name (Might be undefined)
   */
  private _displayName?: string;

  /**
   * The user's id
   */
  public id: string;

  /**
   * The user's external auths (Linked platforms)
   */
  public externalAuths: ExternalAuths;

  /**
   * @param client The main client
   * @param data The user's data
   */
  constructor(client: Client, data: UserData) {
    super(client);

    this._displayName = data.displayName;
    this.id = data.id;
    this.externalAuths = data.externalAuths || {};

    // For some reason, no external auths = empty array
    if (Array.isArray(this.externalAuths)) this.externalAuths = {};
  }

  /**
   * The user's display name (In case its undefined, use {@link User#fetch})
   */
  public get displayName(): string | undefined {
    return this._displayName || (Object.values(this.externalAuths)[0] && (Object.values(this.externalAuths)[0] as any).externalDisplayName);
  }

  /**
   * Sends a friendship request to this user or accepts an existing one
   * @throws {UserNotFoundError} The user wasn't found
   * @throws {DuplicateFriendshipError} The user is already friends with the client
   * @throws {FriendshipRequestAlreadySentError} A friendship request has already been sent to the user
   * @throws {InviterFriendshipsLimitExceededError} The client's friendship limit is reached
   * @throws {InviteeFriendshipsLimitExceededError} The user's friendship limit is reached
   * @throws {InviteeFriendshipSettingsError} The user disabled friend requests
   * @throws {InviteeFriendshipRequestLimitExceededError} The user's incoming friend request limit is reached
   * @throws {EpicgamesAPIError}
   */
  public async addFriend() {
    return this.client.addFriend(this.id);
  }

  /**
   * Blocks this user
   * @throws {UserNotFoundError} The user wasn't found
   * @throws {EpicgamesAPIError}
   */
  public async block() {
    return this.client.blockUser(this.id);
  }

  /**
   * Updates this user's display name and external auths
   * @throws {UserNotFoundError} The user wasn't found
   */
  public async fetch() {
    const user = await this.client.getProfile(this.id);
    if (!user) throw new UserNotFoundError(this.id);

    this.update(user);
  }

  /**
   * Fetches battle royale v2 stats for this user
   * @throws {UserNotFoundError} The user wasn't found
   * @throws {StatsPrivacyError} The user set their stats to private
   * @throws {EpicgamesAPIError}
   */
  public async getBRStats(startTime?: number, endTime?: number) {
    return this.client.getBRStats(this.id, startTime, endTime);
  }

  /**
   * Updates this user with the given data
   * @param data The updated user data
   */
  public update(data: UserData) {
    this._displayName = data.displayName;
    this.externalAuths = data.externalAuths || {};
  }
}

export default User;
