"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@apollo/client/react";
import { useSession } from "next-auth/react";
import { CREATE_USER_MUTATION, LIST_USERS_QUERY, UPDATE_USER_MUTATION } from "@/graphql/operations/users";
import { ROLES, type Role } from "@/lib/constants";
import { canAssignRole } from "@/lib/rbac";

type UserRow = {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: string;
};

type UsersData = { blogPortalUsers: UserRow[] };

export function UsersManager() {
  const { data: sessionData } = useSession();
  const actorRole = (sessionData?.user?.role as Role) || "READER";
  const { data, loading, error, refetch } = useQuery<UsersData>(LIST_USERS_QUERY);
  const [createUser, { loading: creating }] = useMutation(CREATE_USER_MUTATION);
  const [updateUser] = useMutation(UPDATE_USER_MUTATION);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("AUTHOR");
  const [formError, setFormError] = useState("");

  const users = data?.blogPortalUsers || [];
  const assignable = ROLES.filter((r) => {
    if (r === "READER") return false;
    return canAssignRole(actorRole, r);
  });

  if (loading) return <p className="text-sm text-stone-500">Loading users…</p>;
  if (error) return <p className="text-sm text-red-700">{error.message}</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Users</h1>
      <form
        className="grid gap-3 rounded-lg border border-stone-200 bg-white p-4 md:grid-cols-2"
        onSubmit={async (e) => {
          e.preventDefault();
          setFormError("");
          try {
            await createUser({
              variables: { input: { name, email, password, role } },
            });
            setName("");
            setEmail("");
            setPassword("");
            await refetch();
          } catch (err) {
            setFormError(err instanceof Error ? err.message : "Failed");
          }
        }}
      >
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name"
          className="rounded-md border border-stone-300 px-3 py-2 text-sm"
        />
        <input
          required
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="rounded-md border border-stone-300 px-3 py-2 text-sm"
        />
        <input
          required
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="rounded-md border border-stone-300 px-3 py-2 text-sm"
        />
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as Role)}
          className="rounded-md border border-stone-300 px-3 py-2 text-sm"
        >
          {assignable.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        <button
          type="submit"
          disabled={creating}
          className="rounded-full bg-stone-900 px-4 py-2 text-sm font-medium text-white md:col-span-2"
        >
          Create user
        </button>
        {formError ? <p className="text-sm text-red-700 md:col-span-2">{formError}</p> : null}
      </form>

      <ul className="divide-y divide-stone-200 rounded-lg border border-stone-200 bg-white">
        {users.map((user) => (
          <li key={user.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
            <div>
              <p className="font-medium">{user.name}</p>
              <p className="text-sm text-stone-500">
                {user.email} · {user.role} · {user.status}
              </p>
            </div>
            <div className="flex gap-2">
              <select
                defaultValue={user.role}
                className="rounded border border-stone-300 px-2 py-1 text-xs"
                onChange={async (e) => {
                  const next = e.target.value as Role;
                  await updateUser({ variables: { id: user.id, input: { role: next } } });
                  await refetch();
                }}
              >
                {assignable.concat(user.role === "OWNER" ? (["OWNER"] as Role[]) : []).map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="text-xs text-stone-600 hover:underline"
                onClick={async () => {
                  await updateUser({
                    variables: {
                      id: user.id,
                      input: { status: user.status === "active" ? "disabled" : "active" },
                    },
                  });
                  await refetch();
                }}
              >
                {user.status === "active" ? "Disable" : "Enable"}
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
