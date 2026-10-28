
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import authService from "./authService";

// ================= REGISTER USER =================
export const registerUser = createAsyncThunk(
  "auth/register",
  async (userData, thunkAPI) => {
    try {
      return await authService.register(userData);
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message ||
          error.response?.data?.error ||
          error.message ||
          "Registration failed. Please try again."
      );
    }
  }
);

// ================= LOGIN USER =================
export const loginUser = createAsyncThunk(
  "auth/login",
  async (credentials, thunkAPI) => {
    try {
      return await authService.login(credentials);
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message ||
          error.response?.data?.error ||
          error.message ||
          "Login failed. Please try again."
      );
    }
  }
);

// ================= INITIAL STATE =================
const initialState = {
  user: JSON.parse(localStorage.getItem("user") || "null"),
  token: localStorage.getItem("token") || null,
  loading: false,
  error: null,
  success: false,
};

// ================= AUTH SLICE =================
const authSlice = createSlice({
  name: "auth",
  initialState,

  reducers: {
    clearAuthError: (state) => {
      state.error = null;
    },

    clearAuthSuccess: (state) => {
      state.success = false;
    },

    logout: (state) => {
      state.user = null;
      state.token = null;
      state.loading = false;
      state.error = null;
      state.success = false;

      localStorage.removeItem("token");
      localStorage.removeItem("user");
    },
  },

  extraReducers: (builder) => {
    builder
      // REGISTER PENDING
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })

      // REGISTER SUCCESS
      .addCase(registerUser.fulfilled, (state) => {
        state.loading = false;
        state.error = null;
        state.success = true;
      })

      // REGISTER FAILED
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.success = false;
        state.error =
          typeof action.payload === "string"
            ? action.payload
            : "Registration failed. Please try again.";
      })

      // LOGIN PENDING
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })

      // LOGIN SUCCESS
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        state.success = true;

        const result = action.payload;
        const data = result?.data ?? result;

        state.user = data?.user ?? null;
        state.token = data?.token ?? null;

        if (state.token) {
          localStorage.setItem("token", state.token);
        }

        if (state.user) {
          localStorage.setItem("user", JSON.stringify(state.user));
        }
      })

      // LOGIN FAILED
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.success = false;
        state.error =
          typeof action.payload === "string"
            ? action.payload
            : "Login failed. Please check your credentials.";
      });
  },
});

export const {
  clearAuthError,
  clearAuthSuccess,
  logout,
} = authSlice.actions;

export default authSlice.reducer;
