import { ReactNode } from "react";
import {
  Activity,
  CalendarCheck2,
  Flame,
  HeartPulse,
  TrendingUp,
} from "lucide-react";

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  actionText: string;
  onAction: () => void;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  actionText,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <div className={`rounded-2xl border border-slate-200 bg-white px-8 py-10 text-center shadow-[0_10px_30px_-24px_rgba(15,23,42,0.45)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_20px_40px_-24px_rgba(15,23,42,0.45)] ${className || ""}`}>
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-[linear-gradient(145deg,#EEF2FF_0%,#F5F3FF_100%)] text-indigo-600">
        {icon}
      </div>
      <h3 className="mt-6 text-2xl font-semibold tracking-tight text-slate-900">{title}</h3>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-slate-500">{description}</p>
      <button
        type="button"
        onClick={onAction}
        className="mt-8 inline-flex items-center justify-center rounded-xl bg-[linear-gradient(135deg,#6366F1_0%,#8B5CF6_100%)] px-6 py-3 text-sm font-semibold text-white shadow-[0_12px_24px_-14px_rgba(99,102,241,0.9)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_30px_-16px_rgba(139,92,246,0.95)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-300/60"
      >
        {actionText}
      </button>
    </div>
  );
}

export function WorkoutPlanEmptyState({ onAction }: { onAction: () => void }) {
  return (
    <EmptyState
      icon={<Activity className="h-9 w-9" />}
      title="Chưa có kế hoạch tập luyện"
      description="Hãy tạo lịch tập đầu tiên để bắt đầu hành trình fitness của bạn."
      actionText="Tạo kế hoạch tập luyện"
      onAction={onAction}
    />
  );
}

export function LatestSessionEmptyState({ onAction }: { onAction: () => void }) {
  return (
    <EmptyState
      icon={<CalendarCheck2 className="h-9 w-9" />}
      title="Bạn chưa có buổi tập nào"
      description="Bắt đầu ghi lại buổi tập đầu tiên để theo dõi tiến bộ."
      actionText="Ghi buổi tập hôm nay"
      onAction={onAction}
    />
  );
}

export function NutritionGoalEmptyState({ onAction }: { onAction: () => void }) {
  return (
    <EmptyState
      icon={<Flame className="h-9 w-9" />}
      title="Chưa đặt mục tiêu calo hàng ngày"
      description="Đặt mục tiêu dinh dưỡng để theo dõi calo nạp vào hiệu quả hơn."
      actionText="Đặt mục tiêu dinh dưỡng"
      onAction={onAction}
    />
  );
}

export function ProgressOverviewEmptyState({ onAction }: { onAction: () => void }) {
  return (
    <EmptyState
      icon={<HeartPulse className="h-9 w-9" />}
      title="Hãy bắt đầu hành trình hôm nay!"
      description="Khi bạn ghi nhận hoạt động, tiến trình sẽ hiển thị ở đây."
      actionText="Bắt đầu ngay"
      onAction={onAction}
    />
  );
}

export function WeeklyChartEmptyState({ onAction }: { onAction: () => void }) {
  return (
    <div className="relative rounded-2xl border border-slate-200 bg-white/95 p-8 text-center shadow-[0_10px_30px_-24px_rgba(15,23,42,0.45)]">
      <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-[linear-gradient(145deg,#EEF2FF_0%,#F5F3FF_100%)] text-indigo-600">
        <TrendingUp className="h-9 w-9" />
      </div>
      <h3 className="text-2xl font-semibold tracking-tight text-slate-900">Chưa có dữ liệu tuần này</h3>
      <p className="mt-3 text-sm leading-7 text-slate-500">Hãy ghi lại calo và bước chân để xem biểu đồ tiến bộ.</p>
      <button
        type="button"
        onClick={onAction}
        className="mt-8 inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition-colors duration-200 hover:border-slate-400 hover:bg-slate-50"
      >
        Ghi hoạt động hôm nay
      </button>
    </div>
  );
}
