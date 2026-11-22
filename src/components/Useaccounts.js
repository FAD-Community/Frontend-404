import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  ApiError,
  getAccounts,
  createAccount as createAccountApi,
  checkUsernameAvailable as checkUsernameApi,
  resendAccountInvitation as resendInvitationApi,
  updateAccountEmail as updateEmailApi,
  deactivateAccount as deactivateAccountApi,
  reactivateAccount as reactivateAccountApi,
} from "../api/accounts.api";
import { mapAccountFromApi } from "../data/Accounts";

const AccountsContext = createContext(null);

export function AccountsProvider({ children }) {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const refreshAccounts = useCallback(async () => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      setAccounts([]);
      return [];
    }

    setLoading(true);
    try {
      const data = await getAccounts({ page: 1, pageSize: 100 });
      const rawItems = Array.isArray(data) ? data : data?.items || [];
      const mapped = rawItems.map(mapAccountFromApi);
      setAccounts(mapped);
      return mapped;
    } catch {
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshAccounts();
  }, [refreshAccounts]);

  const createAccount = useCallback(
    async (payload) => {
      setActionLoading(true);
      try {
        const created = await createAccountApi(payload);
        await refreshAccounts();
        return created;
      } finally {
        setActionLoading(false);
      }
    },
    [refreshAccounts]
  );

  const resendInvitation = useCallback(
    async (id) => {
      setActionLoading(true);
      try {
        const res = await resendInvitationApi(id);
        await refreshAccounts();
        if (res && res.invitationSent === false) {
          throw new ApiError(
            "A new invitation link was created, but the email couldn't be delivered. Please try again.",
            {
              status: 200,
              code: "invitation.not_sent",
              raw: res,
              invitationSaved: true,
            }
          );
        }
        return res;
      } finally {
        setActionLoading(false);
      }
    },
    [refreshAccounts]
  );

  const updateEmail = useCallback(
    async (id, email) => {
      setActionLoading(true);
      try {
        const res = await updateEmailApi(id, email);
        await refreshAccounts();
        if (res && res.invitationSent === false) {
          throw new ApiError(
            "Email updated, but the invitation couldn't be sent. Click Resend invitation to try again.",
            {
              status: 200,
              code: "invitation.not_sent",
              raw: res,
              invitationSaved: true,
            }
          );
        }
        return res;
      } finally {
        setActionLoading(false);
      }
    },
    [refreshAccounts]
  );

  const setActive = useCallback(
    async (id, active) => {
      setActionLoading(true);
      try {
        const res = active
          ? await reactivateAccountApi(id)
          : await deactivateAccountApi(id);
        await refreshAccounts();
        return res;
      } finally {
        setActionLoading(false);
      }
    },
    [refreshAccounts]
  );

  const checkUsername = useCallback((username) => {
    return checkUsernameApi(username);
  }, []);

  const value = {
    accounts,
    loading,
    actionLoading,
    refreshAccounts,
    createAccount,
    resendInvitation,
    updateEmail,
    setActive,
    checkUsername,
  };

  return (
    <AccountsContext.Provider value={value}>
      {children}
    </AccountsContext.Provider>
  );
}

export default function useAccounts() {
  const ctx = useContext(AccountsContext);
  if (!ctx) {
    throw new Error("useAccounts must be used inside AccountsProvider");
  }
  return ctx;
}