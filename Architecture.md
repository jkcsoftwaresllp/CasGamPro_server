# Server Architecture Document

## 1. Architecture

### 1.1 Current

We're currently using **Monolithic** architecture:

```bash
All Services → Single Server
```

### 1.2 Future

We'll be using **Microservice** architecture for the following benefits:

```bash
SERVERS FOR EACH SERVICE
├── Game Service (game logic)
├── Betting Service (bet management)
├── User Service (user management)
├── History Service (game history)
└── Analytics Service (statistics/reporting)
```

###  1.3 Why Change?

- Better scalability for individual game services
- Isolated game logic and states
- Independent deployment of services
- Improved fault isolation
- Real-time performance

## 2. Techstack

### 2.1 Backend Tech:

- Bun + Express (*Backend Framework*)
- MySQL (*Primary Database*)
- Redis (*Caching & Real-time Game State*)
- Socket.IO (*Real-time Communication*)
- Swagger (*Documenting APIs*)

### 2.2 Dependencies:

#### Libraries
- `bcrypt`: hashing password
- `bcryptjs`: hashing password
- `cors`: manage CORS
- `dotenv`: retrieve stuff from `.env`
- `express-mysql-session`: storing user session
- `express-session`: storing user session
- `socket.io`: for real-time connection.
- `moment`: working with dates.

#### Framework related
- `express`: backend framwork
- `mysql2`: primary database
- `ioredis`: caching & real-time state

### Development
- `nodemon`: watches for changes in file and restarts the server.
- `swagger`: documenting apis

## 3. Data Flow

Divided into 2 sections:
1. **Service Layer** (Low Level)
2. **API Layer** (High)

### 3.1 Service Layer

#### 3.1.1 Service Architecture

```bash
src/
   ├── services/
        ├── <Game>
        │   └── index.js -- Entry File
        └── share/
	        ├── configs/ -- includes (factory, manager, template)
	        ├── helper/ -- reusable functions
	        └── index.js -- Entry File
```

- Each **service** will have its own subdirectory, and include `index.js` for default export.
- All **services** will borrow code from  `shared/`.
    - `helper/` will provide resuable functions
    - `configs/` will contain critical **game architectural** components

#### 3.1.2 Game Architecture

```javascript
Game Architecture (Services):
├── GameManager (manages game instances / regulates game lifecycle)
├── GameFactory (creates game instances)
└── AndarBaharGame (game logic)
└── Lucky7Game (game logic)
└── TeenPattiGame (game logic)
└── DragonTigerGame (game logic)

API Layer (Controllers):
├── userController (user-related API logic)
└── gameController (game-related API logic)
    ├── getCurrentGame
    ├── placeBet
    └── getGameHistory
```

The core game functionality is handled by the Services layer, which consists of:

##### GameManager
- Central orchestrator for all game instances
- Manages game lifecycle (creation, running, termination)
- Maintains registry of active games
- Handles game state persistence
- Ensures continuous game operation (24/7)
- Responsible for game synchronization and recovery

##### GameFactory
- Implements Factory Design Pattern
- Creates appropriate game instances based on game type
- Centralizes game instance creation logic
- Ensures proper game initialization
- Facilitates easy addition of new game types

##### Game Implementations
Each game type has its own implementation class that extends BaseGame:

##### \<GAME>
- Implements \<Game> logic
- Manages game rounds
- Handles card distribution
- Determines winners

### 3.2 API Layer/Controllers

Handles HTTP requests and responses, implementing the interface between clients and the game system.

1. **Server starts**
   Server starts → All connections are ensured  → All games initialize
2. **Game lifecycle begins**
   Game starts betting phase (30s) → Dealing phase → Results → New game starts
3. **Client connects**
   Client connects → Receives current game state → Shows appropriate UI
4. **User interaction**
   User places bet → Server validates → Bet recorded → User waits for result
5. **Game result**
   Game ends → Results calculated → Users notified → Points updated → New game starts

### 2.1 UserController
- Manages user-related operations
- Handles authentication
- Manages user profiles
- Processes user transactions

### 2.2 GameController
Handles game-related API endpoints:

#### 2.2.1 getCurrentGame
- Returns current game state
- Provides game information to clients
- Handles game state queries

#### 2.2.2 placeBet
- Processes betting requests
- Validates bet parameters
- Integrates with game instances
- Handles bet confirmations

#### 2.2.3 getGameHistory
- Retrieves game results history
- Provides historical data
- Handles history queries

### 3.3 Flow of Operations

1. GameManager initializes and maintains game instances
2. Clients interact through API endpoints
3. Controllers validate and process requests
4. Game services handle core game logic
5. Results are returned via API responses

This architecture ensures:
- Clear separation of concerns
- Maintainable codebase
- Scalable system
- Easy addition of new games
- Robust error handling

![[Pasted image 20241230174609.png]]

> ![NOTE] Why using Redis?
> - if server crashed, redis will save the state and resume the game from the saved state.
> - if we add more servers (horizontal scaling), then all servers can share game state.
> - real time bet management
> - game history and analytics (keep last 100 games)


## 4. Scalability & Performance

1. Horizontal Scaling
    - Multiple game instances
    - Load balancer implementation
    - Service replication

2. Performance Optimization
    - Redis caching
    - Database indexing
    - Connection pooling
    - WebSocket optimization

3. Resource Management
    - Game session cleanup
    - Memory usage optimization
    - Connection management


## 5. Security Management (in progress)

### Authentication

**Server-Side Session Management**:
- No exposure of sensitive information on client-side.
- Token revocation.

### Data Protection

Following measure will be used:-
- Input validation
- SQL injection prevention
- XSS protection
- Rate limiting
### Game Security
- Server-side validation
- Anti-cheating measures
- Secure WebSocket connections