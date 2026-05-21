# Development

Run the full app from this directory:

```powershell
npm.cmd run dev
```

Default local URLs:

- Frontend: http://localhost:2000/
- Backend health: http://localhost:3001/api/health

Useful scripts:

```powershell
npm.cmd run dev:client
npm.cmd run dev:api
npm.cmd run type-check
npm.cmd run build
npm.cmd run clean
```

Active code paths:

- Frontend: `src/app`
- Frontend services: `src/services`
- Backend: `server/**/*.ts`

Generated files such as `dist`, `logs/*.log`, and compiled backend `.js/.d.ts/.map` files are ignored.
