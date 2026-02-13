```md
# Project Rules: TaskFlow (MERN)

## Tech Constraints
- Framework: React 18+ with Vite
- Styling: Tailwind CSS
- State: Redux Toolkit (RTK Query preferred)
- Backend: Node.js / Express (ES Modules)
- Database: Mongoose ODM

## Coding Patterns
- Controllers contain business logic
- Use async/await with try/catch
- Standard JSON responses:
  { success: true, data: ... }
  { success: false, error: ... }

- Functional components only
- PascalCase component naming
- Global modal manager or portals

## Feature Specifics
- Google Auth: passport-google-oauth20
- Store JWT in HttpOnly cookies
- Initialize Socket.io in App-level useEffect
- Store socket instance in Redux or Context
```