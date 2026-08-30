import React, { useState, useMemo } from "react";
import {
  useCurrentUser,
  useMyTasks,
  useOpenTasks,
  useActionCardModel,
  formatNorwegianDateTime,
} from "../hooks/useAppHooks";
import { useMockData } from "../context/MockDataContext";
import { ActionCard } from "../components/ActionCard";
import { UserQuickSwitcherBar } from "../components/UserSwitcher";
import { Task, GroupMessage } from "../types";
import { CheckCircle2, Info, MessageSquare, Send } from "lucide-react";
import { useNavigate } from "react-router-dom";

// Sub-component wrapper that uses useActionCardModel for clean architectural separation
const TaskActionCardItem: React.FC<{
  task: Task;
  onClaim?: (taskId: string) => void;
}> = ({ task, onClaim }) => {
  const { currentUser } = useCurrentUser();
  const cardModel = useActionCardModel(task, currentUser);
  const navigate = useNavigate();

  const handlePrimaryClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (cardModel.primaryActionType === "claim" && onClaim) {
      onClaim(task.id);
    } else {
      navigate(cardModel.detailUrl);
    }
  };

  return (
    <ActionCard
      id={`task-card-${task.id}`}
      title={cardModel.title}
      subtitle={cardModel.gatheringTitle}
      dateTime={cardModel.dateTimeFormatted}
      groupName={cardModel.groupName}
      location={cardModel.location}
      statusLabel={cardModel.statusLabel}
      statusVariant={cardModel.badgeVariant}
      primaryButtonText={cardModel.primaryActionLabel}
      onPrimaryClick={cardModel.primaryActionLabel ? handlePrimaryClick : undefined}
      detailUrl={cardModel.detailUrl}
      isMine={cardModel.isAssignedToMe}
    />
  );
};

export const MyPage: React.FC = () => {
  const { currentUser } = useCurrentUser();
  const { data: myTasks, loading: myTasksLoading } = useMyTasks();
  const { data: openTasks, loading: openTasksLoading } = useOpenTasks();
  const { assignTaskToPerson, getUserGroups, getGroupMessages } = useMockData();

  const [feedbackMessage, setFeedbackMessage] = useState<{ text: string; type: "success" | "info" } | null>(null);

  // Group messages for groups user is member of
  const myGroups = useMemo(() => getUserGroups(currentUser.id), [getUserGroups, currentUser.id]);
  const allMyGroupMessages = useMemo(() => {
    const list: { groupName: string; msg: GroupMessage }[] = [];
    myGroups.forEach((g) => {
      const gMsgs = getGroupMessages(g.id);
      gMsgs.forEach((msg) => {
        list.push({ groupName: g.name, msg });
      });
    });
    return list.sort((a, b) => new Date(b.msg.createdAt).getTime() - new Date(a.msg.createdAt).getTime());
  }, [myGroups, getGroupMessages]);

  const handleClaimTask = async (taskId: string) => {
    const res = await assignTaskToPerson(taskId, currentUser.id);
    if (res.success) {
      setFeedbackMessage({
        text: "Takk for at du stiller opp! Oppgaven er nå lagt til i dine oppgaver.",
        type: "success",
      });
      setTimeout(() => setFeedbackMessage(null), 4000);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto bg-slate-50 min-h-screen shadow-md sm:my-4 sm:rounded-3xl sm:border sm:border-slate-200/80 overflow-hidden">
      {/* Quick Mock User Switcher Bar */}
      <UserQuickSwitcherBar />

      <div className="p-4 sm:p-6 space-y-6">
        {/* Floating Feedback Notification */}
        {feedbackMessage && (
          <div
            role="status"
            className={`p-3.5 rounded-2xl border transition-all text-xs sm:text-sm flex items-start gap-2.5 shadow-xs animate-in fade-in slide-in-from-top-2 ${
              feedbackMessage.type === "success"
                ? "bg-emerald-50 text-emerald-950 border-emerald-300"
                : "bg-amber-50 text-amber-950 border-amber-300"
            }`}
          >
            {feedbackMessage.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            )}
            <div className="flex-1 font-medium">{feedbackMessage.text}</div>
            <button
              type="button"
              onClick={() => setFeedbackMessage(null)}
              className="text-xs font-bold text-slate-500 hover:text-slate-800 ml-1 cursor-pointer"
            >
              ×
            </button>
          </div>
        )}

        {/* SEKSJON 1: Mine oppgaver */}
        <section id="section-mine-oppgaver">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              Mine oppgaver
            </h2>
            <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
              {myTasks.length} {myTasks.length === 1 ? "kommende" : "kommende"}
            </span>
          </div>

          {myTasksLoading ? (
            <div className="p-6 text-center bg-white rounded-2xl border border-slate-100 text-xs text-slate-400">
              Laster dine oppgaver...
            </div>
          ) : myTasks.length > 0 ? (
            <div className="space-y-4">
              {myTasks.map((task) => (
                <TaskActionCardItem
                  key={task.id}
                  task={task}
                />
              ))}
            </div>
          ) : (
            <div className="p-6 text-center bg-white rounded-2xl border border-dashed border-slate-200 text-slate-500 space-y-1.5">
              <p className="text-xs font-bold text-slate-700">
                Ingen oppgaver tildelt
              </p>
              <p className="text-[11px] text-slate-400">
                Se nedenfor om det er ledige oppgaver du ønsker å ta.
              </p>
            </div>
          )}
        </section>

        {/* SEKSJON 2: Ledige oppgaver i dine grupper */}
        <section id="section-trenger-hjelp">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              Ledige oppgaver i dine grupper
            </h2>
            <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
              {openTasks.length} {openTasks.length === 1 ? "ledig" : "ledige"}
            </span>
          </div>

          {openTasksLoading ? (
            <div className="p-6 text-center bg-white rounded-2xl border border-slate-100 text-xs text-slate-400">
              Laster ledige oppgaver...
            </div>
          ) : openTasks.length > 0 ? (
            <div className="space-y-4">
              {openTasks.map((task) => (
                <TaskActionCardItem
                  key={task.id}
                  task={task}
                  onClaim={handleClaimTask}
                />
              ))}
            </div>
          ) : (
            <div className="p-6 text-center bg-white rounded-2xl border border-dashed border-emerald-200 text-slate-500 space-y-1">
              <p className="text-xs font-bold text-emerald-700">
                Alt er dekket!
              </p>
              <p className="text-[11px] text-slate-400">
                Ingen ubesatte oppgaver i dine grupper akkurat nå.
              </p>
            </div>
          )}
        </section>

        {/* SEKSJON 3: Beskjed fra dine grupper */}
        <section id="section-mine-gruppebeskjeder" className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
              <span>Beskjed fra dine grupper</span>
            </h2>
            <span className="text-[10px] font-bold text-slate-600 bg-slate-200/80 px-2 py-0.5 rounded-full">
              {allMyGroupMessages.length}
            </span>
          </div>

          {allMyGroupMessages.length === 0 ? (
            <div className="p-4 bg-white rounded-2xl border border-slate-200/80 text-xs text-slate-400 italic text-center">
              Ingen nye beskjeder i dine grupper for øyeblikket.
            </div>
          ) : (
            <div className="space-y-2.5">
              {allMyGroupMessages.map(({ groupName, msg }) => (
                <div
                  key={msg.id}
                  className="p-3.5 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800 flex items-center gap-1.5">
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-800 border border-emerald-100">
                        {groupName}
                      </span>
                      <span>{msg.senderName}</span>
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {formatNorwegianDateTime(msg.createdAt)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                    {msg.content}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
