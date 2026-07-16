import AttemptReview from "../../features/attempts/AttemptReview";

export default async function AttemptReviewPage({ params }: { params: Promise<{ attemptId: string }> }) {
  const { attemptId } = await params;
  return <AttemptReview attemptId={attemptId} />;
}
