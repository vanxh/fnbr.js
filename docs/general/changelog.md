# Changelog

## 2.2.0

### Additions
* Tournament Tokens
  * Added `Client#getEventTokens()`
  * Can be used to fetch arena divisions of any season, check tournament eligiblity and more

### Changes
* Auth Refreshing
  * Added a config option to control what the client will do in case the refresh token is invalid (`ClientOptions#restartOnInvalidRefresh`)
  * Removed `ClientOptions#tokenVerifyInterval`
  * Improved error messages for auth refresh errors
* Fortnite News
  * Added the new battle royale MOTD news endpoint to `Client#getNews()`

### Fixes
* Auth Refreshing
  * Fixed an issue that caused the client to not reauthenticate properly
* Device Auths
  * Readded support for device auths in snake case (was removed in 2.0.0)

<hr>

## 2.1.0

### Additions
* Tournament replays
  * This method returns a `Buffer` for an actual .replay file (which can be even used ingame)
  * Config options allow you to only download specific data
  * Added `Client#downloadTournamentReplay()`
* Authentication
  * Added an alternative to device auths (since they're known for causing password resets)
  * A launcher refresh token lasts for 30 days and needs to be refreshed each time you authenticate (using the event)
  * Click [here](https://fnbr.js.org/#/docs/main/stable/examples/refreshtoken) for an example
  * Added the `Client#refreshtoken:created` event
  * Added `AuthOptions#launcherRefreshToken`
* Creative Island Lookup
  * Added `Client#getCreativeIsland()`
* Creative Discovery Surface
  * Added `Client#getCreativeDiscoveryPanels()`

<hr>

## 2.0.2

### Fixes
* Friend Caches
  * Fixed an issue that caused the friend cache to hold no values
* Client Config
  * Fixed missing documentation for some `ClientOptions` properties

<hr>

## 2.0.1

### Additions
* Season Timestamps
  * Added season end timestamp for CH2_S7
  * Added season start timestamp for CH2_S8

### Fixes
* Parties
  * Fixed `ClientParty#hideMembers()` (did not hide members properly)

<hr>

## 2.0.0

### Additions
* TypeScript Rewrite
  * The library has been completely rewritten in TypeScript
  * Type definitions for all classes
  * Better intellisense
  * Improved documentation
* Exceptions
  * Custom errors that extend `Error` were added. Examples: `FriendNotFoundError`, `FriendshipRequestAlreadySentError`
  * Documentation has been added for the exceptions a method could potentially throw
* Request To Join
  * Added `Client#sendRequestToJoin()`
  * Added `Client#party:joinrequest`
  * Added `Friend#sendJoinRequest()`
* Blurl Streams
  * Added `Client#downloadBlurlStream()`
  * Added `Client#getRadioStations()`
* Party Properties
  * Added `Party#squadFill`
  * Added `Party#playlist`
  * Added `Party#customMatchmakingKey`
* Client Party Methods
  * Added `ClientParty#hideMember()`
  * Added `ClientParty#setMaxSize()`
  * Added `ClientParty#setSquadFill()`
* Party Member Properties
  * PartyMember now extends User
  * Added `PartyMember#assistedChallenge`
  * Added `PartyMember#banner`
  * Added `PartyMember#battlepass`
  * Added `PartyMember#customDataStore`
  * Added `PartyMember#inputMethod`
  * Added `PartyMember#isMarkerSet`
  * Added `PartyMember#markerLocation`
  * Added `PartyMember#matchInfo`
  * Added `PartyMember#platform`
* Client Party Member Methods
  * Added `ClientPartyMember#setAssistedChallenge()`
  * Added `ClientPartyMember#setMarker()`
  * Added `ClientPartyMember#setPet()`
* Client Status
  * Added `ClientOptions#defaultOnlineType`
  * Added `Client#resetStatus()`
* User Blocking / Unblocking
  * Added `User#block()`
  * Added `BlockedUser#unblock()`
* Friend's Parties
  * Added `Friend#party`
* Client Config
  * Added `ClientOptions#cacheSettings`
  * Added `ClientOptions#connectToXMPP`
  * Added `ClientOptions#createParty`
  * Added `ClientOptions#forceNewParty`
  * Added `ClientOptions#handleRatelimits`
  * Added `ClientOptions#partyBuildId`
  * Added `ClientOptions#restRetryLimit`
  * Added `ClientOptions#tokenVerifyInterval`
  * Added `ClientOptions#fetchFriends`
* Client Methods
  * Added `Client#getParty()`
  * Added `Client#getClientParty()`
  * Added `Client#searchProfiles()`
  * Added `Client#sweepPresences()`
* Events
  * Added `Client#party:member:confirmation`
  * Added `Client#disconnected`
  * Added `Client#xmpp:chat:error`
  * Added `Client#xmpp:message:error`
  * Added `Client#xmpp:presence:error`

### Changes
* Client Status
  * **(Breaking)** Renamed `ClientOptions#status` to `ClientOptions#defaultStatus`
  * **(Breaking)** Added the parameter `onlineType` to `Client#setStatus`
* Tournaments
  * **(Breaking)** `Client#getTournaments()` now returns `Array<Tournament>`
  * **(Breaking)** Renamed `Client#getTournamentWindow()` to `Client#getTournamentWindowResults()`
* User Blocking / Unblocking
  * **(Breaking)** Renamed `Client#friend:blocked` and `Client#friend:unblocked` to `Client#user:blocked` and `Client#user:unblocked`
  * **(Breaking)** Renamed `Client#blockFriend()` and `Client#unblockFriend()` to `Client#blockUser()` and `Client#unblockUser()`
  * **(Breaking)** Renamed `Client#blockedFriends` to `Client#blockedUsers`
* Client Methods
  * **(Breaking)** Renamed `Client#getServerStatus()` to `Client#getEpicgamesServerStatus()`
  * **(Breaking)** Renamed `Client#getBRStore()` to `Client#getStorefronts()`
  * `Client#getBRStats()` now accepts an array of user IDs
  * **(Breaking)** Removed `Client#getRadioStream()` in favor of `Client#downloadBlurlStream()`

### Fixes
* Fixed Client Party Member Readiness Methods
  * Fixed `ClientPartyMember#setReadiness()`
  * Fixed `ClientPartyMember#setSittingOut()`
* Client XMPP security vulnerability
  * Fixed a vulnerability that allowed programs to emit client events
* Wait For Event Method
  * Fixed the `filter` parameter for `Client#waitForEvent()`

<hr>

## 1.4.1

### Fixes
* Parties
  * Fixed "outdated version" bug that occured when a user tried to join the client's party

<hr>

## 1.4.0

### Additions
* Client Methods
  * Added `Client#getRadioStream()`
* Parties
  * Added `ClientPartyMember#setPlaying()`
  * Added `PartyMember#fetch()` (Used internally to resolve display names)
* Documentation
  * Added third party API examples

### Fixes
* Parties
  * Fixed extremely rare bug that caused the party to be stuck on the patching state
  * Fixed bug that prevented users from accepting the bot's party invites if its party is private
  * Fixed rare party stale revision bug
  * Fixed party voice chat icon not showing up
* Misc
  * Code style updates

<hr>

## 1.3.0

### Additions
* Parties
  * Added `Party#setPlaylist()`
  * Added `ClientPartyMember#setSittingOut()`
  * Added `ClientPartyMember#clearBackpack()`
* Client Methods
  * Added `Client#getFortniteServerStatus()`

### Fixes
* Parties
  * Updated the party build id for version 14.10 ("old version" join bug)
  * Fixed cosmetic variants
* XMPP
  * Fixed XMPP reconnection error (Thanks to [Théo](https://discord.com/users/448882532830674948) for reporting it)
  * The XMPP client will now use a new resource string each time you restart the client
* Presences
  * Fixed issue that occured when sending a status (presence) to a single friend
* Client Methods
  * Fixed `Client#getNews()` returning an empty array sometimes
  * The client will now ignore errors on shutdown
* Misc
  * Updated season start and end timestamps
  * Fixed documentation for `Party#hideMembers()`

<hr>

## 1.2.0

### Additions
* Client Methods
  * Added `Client#getFortniteServerStatus()`
  * Added `Client#getTournaments()`
  * Added `Client#getTournamentWindow()`
* Parties
  * Added `PartyMember#backpack`

### Changes
* Debugging
  * Added total request time to HTTP debugging 

### Fixes
* Parties
  * Fixed error that occured when the client accepted another bot's invites
  * Trying to join a party which the client previously got kicked from now throws an error
  * The client now handles user_has_party when trying to join a party
  * Fixed some bugs related to party invites
* Authentication Refreshing
  * The client will now reauthenticate when a request fails due to an invalid token
  * Fixed reauthentication issue

<hr>

## 1.1.0

### Additions
* Presences
  * Added `ClientOptions#cachePresences`
* Client Methods
  * Added `Client#getBREventFlags()`
* Parties
  * Added `Party#hideMembers()`
* Documentation
  * Added deviceauth example

### Changes
* Presences
  * **(Breaking)** Added `before` and `after` parameter to `Client#friend:presence`
* Parties
  * **(Breaking)** `PartyMember#outfit`, `PartyMember#pickaxe` and `PartyMember#emote` now return the ID instead of the asset path

### Fixes
* Parties
  * Fixed error that occured when the client got kicked from its party
  * Fixed accepting party invites & joining parties

<hr>

## 1.0.3

### Additions
* JSDoc
  * Improved JSDoc for some methods
  * Added examples for variants

### Changes
* Party Privacy
  * `Party#setPrivacy()` must now use the enum

### Fixes
* Client Login
  * `Client#login()` now waits until all party properties are fully loaded
* Party Privacy
  * `Party#setPrivacy()` now updates `PartyConfig#privacy`
  * Setting the party privacy to the current one now throws an error instead of glitching out the party
* Parties
  * Fixed party issues when the xmpp client reconnects (caused -93 and -81 error codes)
  * Previous emote is now being cleared when you set it
  * You no longer have to set a delay to emote when someone joins the client's party