import { createRandomUser, findUsers } from "./actions";

export default async function Home() {
  // 在 Next.js 16 中，你可以直接在这里写 await
  const res = await fetch("https://api.github.com/repos/vercel/next.js");
  const data = await res.json();

  // 2. 从数据库读取所有用户
  const allUsers = await findUsers();

  return (
    <main className="p-24">
      <h1 className="text-4xl font-bold">Hello Next.js 16</h1>
      <p className="mt-4">Next.js Stars: {data.stargazers_count}</p>
      <form action={createRandomUser} className="mt-4">
        <button className="rounded-md bg-black px-4 py-2 text-white">
          Create random user
        </button>
      </form>

      <ul className="mt-4 list-disc ml-6">
        {allUsers.map((user) => (
          <li key={user.id}>{user.email}</li>
        ))}
      </ul>
    </main>
  );
}
