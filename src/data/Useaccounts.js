import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  SEED_ACCOUNTS,
  CURRENT_ADMIN,
  normalizeAccounts,
  makeEvent,
  fmtDate,
} from "../data/Accounts";

const STORAGE_KEY = "kidoo.accounts.v1";
const SESSION_KEY = "kidoo.session"; // id الأدمن اللي عامل login (الافتراضي: Default admin)

/** يدمج أي بيانات مبدئية جديدة (زي Yara وصلاحيات الأدمنز) مع البيانات المتخزنة قبل كده */
function mergeSeed(list) {
  const merged = [...list];

  SEED_ACCOUNTS.forEach((seed) => {
    const i = merged.findIndex((a) => a.id === seed.id);

    if (i === -1) {
      merged.push(seed);
    } else {
      if (seed.privileges && !merged[i].privileges) {
        merged[i] = {
          ...merged[i],
          privileges: seed.privileges,
        };
      }

      // جديد: سجل الإنشاء بتاع الأدمنز لازم يحمل الصلاحيات (علشان Audit history في Edit privileges)
      const seedCreated = seed.history?.[0];

      if (seedCreated?.privileges && !merged[i].history?.[0]?.privileges) {
        merged[i] = {
          ...merged[i],
          history: [seedCreated, ...(merged[i].history || []).slice(1)],
        };
      }
    }
  });

  return merged;
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);

    if (raw) {
      const parsed = JSON.parse(raw);

      if (Array.isArray(parsed)) {
        return normalizeAccounts(mergeSeed(parsed));
      }
    }
  } catch {
    /* ignore */
  }

  return normalizeAccounts(SEED_ACCOUNTS);
}

function loadSession() {
  try {
    return localStorage.getItem(SESSION_KEY) || "acc-1";
  } catch {
    return "acc-1";
  }
}

const AccountsContext = createContext(null);

/**
 * مصدر واحد لبيانات الحسابات والأدمن الحالي.
 * البيانات بتتحفظ في localStorage.
 * لف التطبيق بيه في App.js.
 * لما تربط الـ API: استبدل جوه الدوال بنداءات fetch/axios.
 */
export function AccountsProvider({ children }) {
  const [accounts, setAccounts] = useState(load);
  const [sessionId, setSessionId] = useState(loadSession);

  // حفظ الحسابات في localStorage عند أي تغيير
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
    } catch {
      /* ignore */
    }
  }, [accounts]);

  // حفظ جلسة الأدمن الحالي
  useEffect(() => {
    try {
      localStorage.setItem(SESSION_KEY, sessionId);
    } catch {
      /* ignore */
    }
  }, [sessionId]);

  const currentAdmin =
    accounts.find((a) => a.id === sessionId) || accounts[0];

  const actor = currentAdmin?.name || CURRENT_ADMIN;

  const update = useCallback((id, fn) => {
    setAccounts((list) =>
      list.map((a) => (a.id === id ? fn(a) : a))
    );
  }, []);

  /** إنشاء حساب جديد + إرسال دعوة */
  const addAccount = useCallback(
    (form) => {
      const id = `acc-${Date.now()}`;

      const account = {
        id,
        name: form.fullName,
        username: form.username,
        email: form.email,
        role: form.role,
        classId: form.classId || "",
        status: "Invited",
        avatar: form.role === "Teacher" ? "blue" : "amber",
        history: [
          makeEvent("created", { by: actor }),
          makeEvent("sent", { by: actor }),
        ],
      };

      setAccounts((list) => [...list, account]);

      return id;
    },
    [actor]
  );

  /** إنشاء أدمن جديد بصلاحيات محددة + إرسال دعوة */
  const addAdmin = useCallback(
    (form) => {
      const id = `acc-${Date.now()}`;
      const tones = ["cyan", "green", "blue", "amber", "red"];

      const tone =
        tones[
          [...form.fullName].reduce(
            (n, c) => n + c.charCodeAt(0),
            0
          ) % tones.length
        ];

      const account = {
        id,
        name: form.fullName,
        username: form.username,
        email: form.email,
        role: "Admin",
        status: "Invited",
        avatar: tone,
        privileges: form.privileges,
        history: [
          makeEvent("created", { by: actor, privileges: form.privileges }),
          makeEvent("sent", { by: actor }),
        ],
      };

      setAccounts((list) => [...list, account]);

      return id;
    },
    [actor]
  );

  /** جديد: تعديل صلاحيات أدمن (بيتسجل في Audit history) */
  const updatePrivileges = useCallback(
    (id, privileges) => {
      update(id, (a) => {
        const before = a.privileges || [];
        const added = privileges.filter((k) => !before.includes(k));
        const removed = before.filter((k) => !privileges.includes(k));

        // مفيش تغيير = مفيش حاجة تتسجل
        if (!added.length && !removed.length) return a;

        return {
          ...a,
          privileges,
          history: [
            ...a.history,
            makeEvent("privileges", { by: actor, added, removed }),
          ],
        };
      });
    },
    [update, actor]
  );

  /** إعادة إرسال الدعوة مع إمكانية تعديل البيانات */
  const resendInvitation = useCallback(
    (id, form) => {
      update(id, (a) => ({
        ...a,
        name: form.fullName,
        username: form.username,
        email: form.email,
        role: form.role,
        classId: form.classId || "",
        status: "Invited",
        history: [
          ...a.history,
          makeEvent("sent", {
            by: actor,
            resent: true,
          }),
        ],
      }));

      return id;
    },
    [update, actor]
  );

  /** تعديل بيانات الحساب */
  const updateAccount = useCallback(
    (id, patch) => {
      update(id, (a) => ({
        ...a,
        ...patch,
        history: [
          ...a.history,
          makeEvent("edited", { by: actor }),
        ],
      }));
    },
    [update, actor]
  );

  /** تفعيل / إيقاف حساب مع الاحتفاظ بالسجل */
  const setActive = useCallback(
    (id, active) => {
      update(id, (a) => ({
        ...a,
        status: active ? "Active" : "Inactive",
        info: active
          ? `Reactivated ${fmtDate(new Date().toISOString())}`
          : "Records kept",
        history: [
          ...a.history,
          makeEvent(
            active ? "reactivated" : "deactivated",
            { by: actor }
          ),
        ],
      }));
    },
    [update, actor]
  );

  /** جديد: تفعيل حساب أدمن بعد إنشاء كلمة المرور (الحالة -> Active + حفظ الـ Hash + تسجيل الحدث) */
  const activateAccount = useCallback(
    (id, passwordHash) => {
      update(id, (a) => ({
        ...a,
        status: "Active",
        passwordHash,
        history: [...a.history, makeEvent("activated", { by: a.name })],
      }));
    },
    [update]
  );

  /** حذف أدمن من الحسابات */
  const deleteAdmin = useCallback(
    (id) => {
      const target = accounts.find((a) => a.id === id);

      // الحساب غير موجود
      if (!target) {
        return false;
      }

      // منع حذف الأدمن الافتراضي
      if (target.status === "Default" || target.id === "acc-1") {
        return false;
      }

      // السماح بحذف حسابات الأدمن فقط
      if (target.role !== "Admin") {
        return false;
      }

      // حذف الأدمن من قائمة الحسابات
      setAccounts((list) =>
        list.filter((a) => a.id !== id)
      );

      return true;
    },
    [accounts]
  );

  const value = useMemo(
    () => ({
      accounts,
      currentAdmin,
      setSessionId,
      addAccount,
      addAdmin,
      updatePrivileges,
      resendInvitation,
      updateAccount,
      setActive,
      deleteAdmin,
      activateAccount,
    }),
    [
      accounts,
      currentAdmin,
      addAccount,
      addAdmin,
      updatePrivileges,
      resendInvitation,
      updateAccount,
      setActive,
      deleteAdmin,
      activateAccount,
    ]
  );

  return (
    <AccountsContext.Provider value={value}>
      {children}
    </AccountsContext.Provider>
  );
}

export default function useAccounts() {
  const ctx = useContext(AccountsContext);

  if (!ctx) {
    throw new Error(
      "useAccounts لازم يتستخدم جوه <AccountsProvider>"
    );
  }

  return ctx;
}