import { use } from "react";

type Review = { id: number; content: string; author: string };

type ReviewsProps = {
  reviewsPromise: Promise<Review[]>;
};

export default function Reviews({ reviewsPromise }: ReviewsProps) {
  const data = use(reviewsPromise as Promise<Review[]>);
  return (
    <ul className="space-y-3">
      {data.map((review: Review) => (
        <li key={review.id} className="border-b pb-2">
          <p className="text-gray-700">{review.content}</p>
          <span className="text-sm text-gray-400">— {review.author}</span>
        </li>
      ))}
    </ul>
  );
}
