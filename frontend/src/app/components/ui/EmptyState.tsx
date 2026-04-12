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
    <div className={`rounded-3xl border border-violet-100 bg-white shadow-sm px-6 py-10 text-center ${className || ""}`}>
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-violet-200 via-violet-100 to-white text-violet-700 shadow-md">
        {icon}
      </div>
      <h3 className="mt-6 text-xl font-semibold text-slate-900">{title}</h3>
      <p className="mt-3 text-sm leading-6 text-slate-500">{description}</p>
      <button
        type="button"
        onClick={onAction}
        className="mt-6 inline-flex items-center justify-center rounded-full bg-gradient-to-r from-[#7C3AED] to-[#A855F7] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 transition hover:-translate-y-0.5 hover:shadow-violet-500/30"
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
    <div className="relative rounded-3xl border border-violet-100 bg-white/95 p-8 text-center shadow-sm shadow-violet-100/80">
      <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-violet-200 via-violet-100 to-white text-violet-700 shadow-md">
        <TrendingUp className="h-9 w-9" />
      </div>
      <h3 className="text-xl font-semibold text-slate-900">Chưa có dữ liệu tuần này</h3>
      <p className="mt-3 text-sm leading-6 text-slate-500">Hãy ghi lại calo và bước chân để xem biểu đồ tiến bộ.</p>
      <button
        type="button"
        onClick={onAction}
        className="mt-6 inline-flex items-center justify-center rounded-full bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700"
      >
        Ghi hoạt động hôm nay
      </button>
    </div>
  );
}
