import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";

import { useRouter } from "next/router";
import Link from "next/link";

export default function Signup() {
  const router = useRouter();
  const { user, signup } = useAuth();
  const [data, setData] = useState({
    email: "",
    password: "",
    displayName: "",
  });

  const handleSignup = async (event: any) => {
    event.preventDefault();
    try {
      await signup(data.email, data.password, data.displayName);
    } catch (err) {
      alert("註冊資訊有誤");
      console.log(err);
    }
  };

  return (
    <>
      <div className="flex min-h-full items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">
          <div>
            <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-white">
              Sign up
            </h2>
          </div>
          <form className="mt-8 space-y-6" onSubmit={handleSignup}>
            <input type="hidden" name="remember" defaultValue="true" />
            <div className="-space-y-px rounded-md shadow-sm">
              <div>
                <label className="sr-only">Name</label>
                <input
                  id="display-name"
                  onChange={(e: any) =>
                    setData({
                      ...data,
                      displayName: e.target.value,
                    })
                  }
                  value={data.displayName}
                  name="displayName"
                  type="displayName"
                  autoComplete="displayName"
                  required
                  className="relative block w-full appearance-none rounded-none rounded-t-md border border-gray-300 px-3 py-2 text-white placeholder-gray-500 focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                  placeholder="Name"
                />
              </div>
              <div>
                <label htmlFor="email-address" className="sr-only">
                  Email address
                </label>
                <input
                  id="email-address"
                  onChange={(e: any) =>
                    setData({
                      ...data,
                      email: e.target.value,
                    })
                  }
                  value={data.email}
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="relative block w-full appearance-none rounded-none border border-gray-300 px-3 py-2 text-white placeholder-gray-500 focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                  placeholder="Email address"
                />
              </div>
              <div>
                <label htmlFor="password" className="sr-only">
                  Password
                </label>
                <input
                  id="password"
                  onChange={(e: any) =>
                    setData({
                      ...data,
                      password: e.target.value,
                    })
                  }
                  value={data.password}
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="relative block w-full appearance-none rounded-none rounded-b-md border border-gray-300 px-3 py-2 text-white placeholder-gray-500 focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                  placeholder="Password"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                className="group relative flex w-full justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                <span className="absolute inset-y-0 left-0 flex items-center pl-3"></span>
                Sign up
              </button>
            </div>
          </form>
          <Link href="/login">
            <div className="mt-2 text-xs text-right text-indigo-600 cursor-pointer">
              切換至登入
            </div>
          </Link>
        </div>
      </div>
    </>
  );
}
