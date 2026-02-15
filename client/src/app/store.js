import { configureStore } from "@reduxjs/toolkit";
import { baseApi } from "./baseApi";
import authReducer from "../features/auth/authSlice";
import { rtkQueryErrorLogger } from "./errorHandler";

/**
 * Redux store configuration.
 *
 * Per architecture.md §8:
 *   Server data → RTK Query (via baseApi)
 *   Auth state  → Redux slice
 *   UI state    → Local or Context
 */
const store = configureStore({
  reducer: {
    [baseApi.reducerPath]: baseApi.reducer,
    auth: authReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(baseApi.middleware, rtkQueryErrorLogger),
  devTools: import.meta.env.DEV,
});

export default store;
