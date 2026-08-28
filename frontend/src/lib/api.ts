import axios, {
  AxiosError,
  AxiosRequestConfig,
  InternalAxiosRequestConfig,
} from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

// Klient i veçantë për refresh — pa interceptors, që të mos krijojë cikël
const refreshClient = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

// ===== Menaxhimi i tokenave =====

export const tokens = {
  get access() {
    return typeof window !== "undefined"
      ? localStorage.getItem("accessToken")
      : null;
  },
  get refresh() {
    return typeof window !== "undefined"
      ? localStorage.getItem("refreshToken")
      : null;
  },
  save(data: { accessToken: string; refreshToken: string }) {
    localStorage.setItem("accessToken", data.accessToken);
    localStorage.setItem("refreshToken", data.refreshToken);
  },
  clear() {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userRoles");
  },
};

// ===== Rifreskimi =====

// Nëse disa kërkesa dështojnë njëkohësisht, bëjmë vetëm një refresh
// dhe të tjerat presin rezultatin e tij.
let refreshing: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = tokens.refresh;
  if (!refreshToken) return null;

  try {
    const { data } = await refreshClient.post<{
      accessToken: string;
      refreshToken: string;
      email: string;
      roles: string[];
    }>("/auth/refresh", { refreshToken });

    tokens.save(data);
    localStorage.setItem("userEmail", data.email);
    localStorage.setItem("userRoles", JSON.stringify(data.roles));

    return data.accessToken;
  } catch {
    return null;
  }
}

function logoutAndRedirect() {
  tokens.clear();
  if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
    window.location.href = "/login";
  }
}

// ===== Interceptors =====

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = tokens.access;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as AxiosRequestConfig & { _retried?: boolean };

    // Vetëm 401, vetëm një herë, dhe jo për vetë endpointet e auth-it
    const isAuthCall = original?.url?.includes("/auth/");

    if (
      error.response?.status !== 401 ||
      original?._retried ||
      isAuthCall ||
      typeof window === "undefined"
    ) {
      return Promise.reject(error);
    }

    original._retried = true;

    // Nëse dikush tjetër tashmë po rifreskon, prit atë
    refreshing ??= refreshAccessToken().finally(() => {
      refreshing = null;
    });

    const newToken = await refreshing;

    if (!newToken) {
      logoutAndRedirect();
      return Promise.reject(error);
    }

    // Përsërit kërkesën origjinale me token-in e ri
    original.headers = {
      ...original.headers,
      Authorization: `Bearer ${newToken}`,
    };

    return api(original);
  }
);