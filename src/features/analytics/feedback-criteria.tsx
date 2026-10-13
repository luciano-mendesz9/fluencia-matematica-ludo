import type { AnalyticsPolicy } from "@/src/domain/analytics";

export function FeedbackCriteria({ policy, className = "" }: { policy: AnalyticsPolicy; className?: string }) {
  const configured = policy.minimumDistinctQuestions !== null && policy.reviewThresholdPercent !== null;
  return (
    <div className={`rounded-control border border-blue-200 bg-blue-50 p-4 text-sm leading-6 text-blue-950 ${className}`.trim()}>
      <p className="font-bold">Quando há dados suficientes?</p>
      {configured ? (
        <p>São necessárias pelo menos <strong>{policy.minimumDistinctQuestions} questões distintas</strong> na mesma habilidade e dificuldade. Abaixo de <strong>{policy.reviewThresholdPercent}% de precisão</strong>, o sistema sugere retomada, sem transformar o resultado em nota ou diagnóstico.</p>
      ) : (
        <p>Ainda não há uma quantidade oficial configurada: a decisão pedagógica OD-003 está pendente. A proposta documental é <strong>5 questões distintas</strong> na mesma habilidade e dificuldade; ela não foi ativada automaticamente para não apresentar uma proposta como regra validada.</p>
      )}
    </div>
  );
}
