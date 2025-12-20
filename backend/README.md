

## 📚 API Endpoints

### 🔐 Authentication
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| `GET` | `/api/auth/login` | Initiate GitHub OAuth (Full Access) | Public |
| `GET` | `/api/auth/login/basic` | Initiate GitHub OAuth (Basic Access) | Public |
| `GET` | `/api/auth/callback` | OAuth Callback URL | Public |
| `POST` | `/api/auth/logout` | Logout user | Public |
| `GET` | `/api/auth/me` | Get current authenticated user info | **Auth (User)** |
| `GET` | `/api/auth/me/full` | Get full user info including private stats | **Auth (User)** |

### 👑 Admin (Restricted - 'anantacoder')
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| `GET` | `/api/admin/update-status` | Get status of background update jobs | **Admin Only** |
| `POST` | `/api/admin/update-all-private-data` | Trigger update for all user private data | **Admin Only** |

### 🏆 Rankings
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| `GET` | `/api/rankings` | Get global leaderboard (paginated) | Public |
| `GET` | `/api/rankings/{username}` | Get specific user ranking | Public |
| `POST` | `/api/rankings/update` | Update/Add user to leaderboard | **Admin Only** |

### 👤 User Data & Search
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| `GET` | `/api/user/{username}` | Get extended user info (GitHub + Custom) | Public |
| `GET` | `/api/status/{username}` | Get basic user status | Public |
| `POST` | `/api/status` | Get status (body payload) | Public |
| `POST` | `/api/batch` | Batch fetch multiple users | Public |
| `POST` | `/api/ai/compare` | Compare users using AI | Public |
| `GET` | `/api/search/history` | Get search history | **Auth (User)** |

### 🔒 Private Data (Self)
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| `GET` | `/api/me/private` | Get my private repository stats | **Auth (User)** |
| `POST` | `/api/me/private/refresh` | Refresh my private data from GitHub | **Auth (User)** |

### 🔔 Notifications
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| `GET` | `/api/notifications` | Get GitHub notifications | **Auth (User)** |
| `POST` | `/api/notifications/{id}/read` | Mark notification as read | **Auth (User)** |

### ⚙️ System & Health
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| `GET` | `/api/health` | Service health check | Public |
| `GET` | `/api/cache/stats` | Cache statistics | Public |
| `POST` | `/api/cache/clear` | Clear system cache | Public |

## 🏗 Architecture
- **Language**: Go (Golang)
- **Database**: PostgreSQL (via `pgx` and standard `database/sql`)
- **API**: RESTful with standard `net/http`
- **Auth**: Service-based Architecture with GitHub OAuth integration
- **Caching**: In-memory caching for API responses
