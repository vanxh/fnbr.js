import BaseMessage from './BaseMessage';
import ClientUser from './ClientUser';
import Friend from './Friend';

/**
 * Represents a friend whisper message
 */
class BaseFriendMessage extends BaseMessage {
  /**
   * The message's content
   */
  public content: string;

  /**
   * The message's author
   */
  public author: Friend | ClientUser;

  /**
   * Replies to this whisper message
   * @param content The message that will be sent
   * @throws {FriendNotFoundError} The user is not friends with the client
   */
  public reply(content: string) {
    return this.client.sendFriendMessage(this.author.id, content);
  }
}

export default BaseFriendMessage;
