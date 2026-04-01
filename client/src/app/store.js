import { configureStore } from "@reduxjs/toolkit";
import { baseApi } from "./baseApi";
import authReducer from "../features/auth/authSlice";
import { rtkQueryErrorLogger } from "./errorHandler";

/**
 * Redux store configuration.
 * Server data → RTK Query, Auth state → Redux slice, UI state → Local/Context
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
