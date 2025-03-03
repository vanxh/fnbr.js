import { UserSearchMatchType, UserSearchResultMatch } from '../../resources/structs';
import Client from '../client/Client';
import User from './User';

/**
 * Represents a user search result entry
 */
class UserSearchResult extends User {
  /**
   * The search match type. Can be "exact" or "prefix"
   */
  public matchType: UserSearchMatchType;

  /**
   * The sorting position of this result
   */
  public sortPosition: number;

  /**
   * The amount of mutual friends the client has with the user
   */
  public mutualFriends: number;

  /**
   * The matched platform display names
   */
  public matches: UserSearchResultMatch[];

  /**
   * @param client The main client
   * @param user The user
   * @param data The user entry data
   */
  constructor(client: Client, user: User, data: any) {
    super(client, {
      id: user.id,
      displayName: user.displayName,
      externalAuths: user.externalAuths,
    });

    this.matchType = data.matchType;
    this.sortPosition = data.sortPosition;
    this.mutualFriends = data.epicMutuals;
    this.matches = data.matches;
  }
}

export default UserSearchResult;
