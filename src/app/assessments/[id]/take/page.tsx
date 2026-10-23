import AssessmentTaker from "./assessment-taker";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export const instant = false;

export default async function TakeAssessmentPage({ params }: PageProps) {
  const { id } = await params;

  return <AssessmentTaker assessmentId={id} />;
}
