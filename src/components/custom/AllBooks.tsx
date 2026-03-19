"use client";
import { use } from "react";

export default function AllBooks({ promise }: { promise: Promise<any[]> }) {
  const books = use(promise);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {books.map((book) => (
        <div
          key={book.id}
          className="p-4 border rounded-xl hover:shadow-md transition"
        >
          <p className="font-semibold">{book.title}</p>
          <p className="text-sm text-gray-400">{book.author}</p>
        </div>
      ))}
    </div>
  );
}
