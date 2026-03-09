"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface Team {
  id: string;
  name: string;
  description: string | null;
}

interface TeamResult {
  id: string;
  name: string;
  rank: number;
  totalScore: number;
}

interface VotingStatus {
  round: number;
  isActive: boolean;
}

export default function VotePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState("");
  const [currentRound, setCurrentRound] = useState(1);
  const [voteCount, setVoteCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [fetchingTeams, setFetchingTeams] = useState(true);
  const [round2Teams, setRound2Teams] = useState<string[]>([]);
  const [hoveredTeam, setHoveredTeam] = useState<string | null>(null);
  const [round1Results, setRound1Results] = useState<TeamResult[]>([]);
  const [votingStatus, setVotingStatus] = useState<VotingStatus[]>([]);
  const [checkingStatus, setCheckingStatus] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  useEffect(() => {
    if (session) {
      // Only fetch voting status for non-admin users
      if (session.user?.role !== "ADMIN") {
        fetchVotingStatus();
      }
    }
  }, [session]);

  useEffect(() => {
    if (session && votingStatus.length > 0) {
      const roundActive = votingStatus.find(
        (v) => v.round === currentRound,
      )?.isActive;

      // Only show message if voting is closed AND we're not already showing a success/error message
      if (!roundActive) {
        // Check if we need to show the closed message
        const shouldShowMessage =
          message.type !== "success" &&
          message.type !== "error" &&
          !(message.type === "info" && message.text.includes("closed"));

        if (shouldShowMessage) {
          setMessage({
            type: "info",
            text: `Voting for Round ${currentRound} is currently closed. Please wait for the admin to open voting.`,
          });
        }
      } else {
        // Clear the message when voting becomes active
        if (message.type === "info" && message.text.includes("closed")) {
          setMessage({ type: "", text: "" });
        }
      }

      if (currentRound === 1) {
        fetchAllTeams();
      } else if (currentRound === 2) {
        fetchRound2Teams();
      }
      fetchVoteCount();
    }
  }, [session, currentRound, votingStatus]);

  const fetchVotingStatus = async () => {
    setCheckingStatus(true);
    try {
      const res = await fetch("/api/admin/voting-control");
      if (res.ok) {
        const data = await res.json();
        setVotingStatus(data);

        // Check if current round is active and clear message if needed
        const roundActive = data.find(
          (v: any) => v.round === currentRound,
        )?.isActive;
        if (
          roundActive &&
          message.type === "info" &&
          message.text.includes("closed")
        ) {
          setMessage({ type: "", text: "" });
        }
      }
    } catch (error) {
      console.error("Error fetching voting status:", error);
    } finally {
      setCheckingStatus(false);
    }
  };

  const fetchVoteCount = async () => {
    try {
      const res = await fetch(`/api/vote/status?round=${currentRound}`);
      if (!res.ok) throw new Error("Failed to fetch vote count");
      const data = await res.json();
      setVoteCount(data.voteCount || 0);
    } catch (error) {
      console.error("Error fetching vote count:", error);
    }
  };

  const fetchAllTeams = async () => {
    setFetchingTeams(true);
    try {
      const res = await fetch("/api/teams");
      if (!res.ok) throw new Error("Failed to fetch teams");
      const data = await res.json();
      setTeams(data.slice(0, 12));

      // Also fetch round 1 results for rankings
      const resultsRes = await fetch("/api/results?round=1");
      if (resultsRes.ok) {
        const resultsData = await resultsRes.json();
        setRound1Results(resultsData);
      }
    } catch (error) {
      console.error("Error fetching teams:", error);
      setMessage({
        type: "error",
        text: "Failed to load teams. Please refresh the page.",
      });
    } finally {
      setFetchingTeams(false);
    }
  };

  const fetchRound2Teams = async () => {
    setFetchingTeams(true);
    try {
      const res = await fetch("/api/results?round=1");
      if (!res.ok) throw new Error("Failed to fetch results");
      const data = await res.json();

      const top6Teams = data.slice(0, 6);
      setRound2Teams(top6Teams.map((t: any) => t.id));
      setTeams(top6Teams);
      setRound1Results(data);
    } catch (error) {
      console.error("Error fetching round 2 teams:", error);
      setMessage({
        type: "error",
        text: "Failed to load Round 2 teams. Please ensure Round 1 results are calculated.",
      });
    } finally {
      setFetchingTeams(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check if voting is active for this round
    const roundActive = votingStatus.find(
      (v) => v.round === currentRound,
    )?.isActive;
    if (!roundActive) {
      setMessage({
        type: "error",
        text: `Voting for Round ${currentRound} is currently closed.`,
      });
      return;
    }

    if (!selectedTeam) {
      setMessage({
        type: "error",
        text: "Please select a team to vote for",
      });
      return;
    }

    if (currentRound === 2 && !round2Teams.includes(selectedTeam)) {
      setMessage({
        type: "error",
        text: "Invalid team selection for Round 2",
      });
      return;
    }

    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const res = await fetch("/api/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamId: selectedTeam,
          round: currentRound,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({
          type: "success",
          text: `Vote cast successfully for Round ${currentRound}!`,
        });
        // Update vote count
        setVoteCount(prev => prev + 1);
        // Keep the same team selected for another vote
        // setSelectedTeam(""); // Uncomment if you want to clear selection after each vote
      } else {
        setMessage({
          type: "error",
          text: data.error || "Error casting vote",
        });
      }
    } catch (error) {
      console.error("Error casting vote:", error);
      setMessage({
        type: "error",
        text: "Network error. Please check your connection and try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const getRoundInfo = () => {
    const roundActive = votingStatus.find(
      (v) => v.round === currentRound,
    )?.isActive;

    switch (currentRound) {
      case 1:
        return {
          title: "Round 1 - Qualifying Round",
          description: roundActive
            ? "Vote for your favorite team. Top 6 will advance to Round 2."
            : "Voting is currently closed. Please check back later.",
          icon: "🎯",
          color: "from-blue-600 to-indigo-600",
          bgColor: "from-blue-50 to-indigo-50",
          isActive: roundActive,
        };
      case 2:
        return {
          title: "Round 2 - FINALS",
          description: roundActive
            ? "Vote for the winner! Top 3 will be declared champions."
            : "Voting is currently closed. Please check back later.",
          icon: "⚡",
          color: "from-purple-600 to-pink-600",
          bgColor: "from-purple-50 to-pink-50",
          isActive: roundActive,
        };
      default:
        return {
          title: "Voting Closed",
          description: "Check leaderboard for results",
          icon: "🏆",
          color: "from-gray-600 to-gray-700",
          bgColor: "from-gray-50 to-gray-100",
          isActive: false,
        };
    }
  };

  if (status === "loading" || fetchingTeams || checkingStatus) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white/70 backdrop-blur-sm rounded-3xl shadow-2xl p-12">
            <div className="flex flex-col items-center justify-center py-16">
              <div className="relative">
                <div className="w-24 h-24 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-indigo-600/20 rounded-full blur-2xl animate-pulse"></div>
              </div>
              <p className="mt-8 text-2xl font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                Loading Voting Portal
              </p>
              <p className="text-gray-500 mt-2">
                Please wait while we prepare your voting session...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (session?.user?.role === "ADMIN") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-8 text-center border border-yellow-200">
            <div className="text-7xl mb-6 animate-bounce">👑</div>
            <h2 className="text-3xl font-bold text-gray-800 mb-4">
              Admins Cannot Vote
            </h2>
            <p className="text-gray-600 mb-8 text-lg">
              As an admin, you cannot participate in voting. Please use the
              admin panel to manage the event.
            </p>
            <button
              onClick={() => router.push("/admin")}
              className="relative group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl blur-lg group-hover:blur-xl opacity-50 group-hover:opacity-75 transition-all duration-300"></div>
              <div className="relative bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-8 py-4 rounded-xl font-semibold hover:shadow-2xl transform hover:scale-105 transition-all duration-200">
                Go to Admin Panel
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const roundInfo = getRoundInfo();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl shadow-xl flex items-center justify-center transform hover:rotate-6 transition-all duration-300">
                <span className="text-4xl">🗳️</span>
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                Cast Your Vote
              </h1>
              <p className="text-gray-600 mt-1 flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                Your voice matters • Vote as many times as you want
              </p>
            </div>
          </div>

          {/* Decorative Line */}
          <div className="h-1 w-full bg-gradient-to-r from-purple-200 via-indigo-200 to-purple-200 rounded-full"></div>
        </div>

        {/* Round Selector Card */}
        <div className="mb-8 bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/50">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl p-2">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
              </div>
              <label className="font-semibold text-gray-700">
                Select Round:
              </label>
            </div>

            <select
              value={currentRound}
              onChange={(e) => setCurrentRound(Number(e.target.value))}
              className="flex-1 bg-gradient-to-r from-purple-50 to-indigo-50 border-0 rounded-xl px-4 py-3 text-gray-700 font-medium focus:ring-2 focus:ring-purple-500 cursor-pointer"
            >
              <option value={1}>Round 1 (12 Teams) - Qualifying</option>
              <option value={2}>Round 2 (6 Teams) - FINALS</option>
              <option value={3} disabled>
                Round 3 - Results Only (No Voting)
              </option>
            </select>
          </div>

          <div className="mt-3 flex items-center justify-between">
            <p className="text-sm text-gray-500 flex items-center gap-2">
              <span
                className={`w-1.5 h-1.5 ${roundInfo.isActive ? "bg-green-400" : "bg-red-400"} rounded-full animate-pulse`}
              ></span>
              {roundInfo.description}
            </p>
            
            {/* Vote count badge */}
            {voteCount > 0 && (
              <span className="bg-purple-100 text-purple-700 text-xs px-3 py-1 rounded-full">
                You've voted {voteCount} time{voteCount !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>

        {/* Round Info Card */}
        <div
          className={`mb-8 bg-gradient-to-r ${roundInfo.color} rounded-2xl shadow-xl p-6 text-white`}
        >
          <div className="flex items-center gap-4">
            <div className="text-5xl animate-bounce-slow">{roundInfo.icon}</div>
            <div>
              <h2 className="text-2xl md:text-3xl font-bold mb-2">
                {roundInfo.title}
              </h2>
              <p className="text-white/90 text-lg">{roundInfo.description}</p>
            </div>
          </div>
          {!roundInfo.isActive && (
            <div className="mt-4 bg-white/20 backdrop-blur-sm rounded-lg p-3 text-center">
              <p className="text-white font-medium">
                ⏰ Voting is currently closed for this round
              </p>
            </div>
          )}
          {roundInfo.isActive && (
            <div className="mt-4 bg-white/20 backdrop-blur-sm rounded-lg p-3 text-center">
              <p className="text-white font-medium">
                🗳️ You can vote multiple times! Each vote counts.
              </p>
            </div>
          )}
        </div>

        {/* Voting Form - Always visible */}
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-6 md:p-8 border border-white/50">
          {/* Message Alert */}
          {message.text && (
            <div
              className={`mb-6 p-4 rounded-xl flex items-start gap-3 ${
                message.type === "success"
                  ? "bg-green-50 text-green-700 border-l-4 border-green-500"
                  : "bg-red-50 text-red-700 border-l-4 border-red-500"
              }`}
            >
              <span className="text-2xl">
                {message.type === "success" ? "✅" : "❌"}
              </span>
              <span className="flex-1 font-medium">{message.text}</span>
              <button
                onClick={() => setMessage({ type: "", text: "" })}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          )}

          {teams.length === 0 ? (
            <div className="text-center py-16 bg-gray-50 rounded-2xl">
              <div className="text-6xl mb-4">📋</div>
              <p className="text-gray-600 text-xl mb-2">
                {currentRound === 1
                  ? "No teams available"
                  : "Round 2 teams not yet determined"}
              </p>
              <p className="text-gray-400">
                {currentRound === 1
                  ? "Please check back later"
                  : "Please wait for Round 1 results"}
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Round 1 Rankings Preview */}
              {currentRound === 1 && round1Results.length > 0 && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 mb-4">
                  <p className="text-sm text-blue-700 font-medium mb-2 flex items-center gap-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                    Current Rankings (Top 6 qualify):
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {round1Results.slice(0, 6).map((team, i) => (
                      <span
                        key={team.id}
                        className="text-xs bg-white px-2 py-1 rounded-full shadow-sm"
                      >
                        #{i + 1} {team.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Teams List */}
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                <label className="block font-semibold text-gray-700 mb-4 text-lg">
                  {currentRound === 1
                    ? "Select a team to vote for (12 teams):"
                    : "Select a team to vote for in the FINALS (6 teams):"}
                </label>

                {teams.map((team, index) => {
                  const isTop3 = currentRound === 2 && index < 3;
                  const teamRank =
                    round1Results.find((r: any) => r.id === team.id)?.rank ||
                    index + 1;

                  return (
                    <div
                      key={team.id}
                      className={`
                        relative group cursor-pointer transition-all duration-300
                        ${hoveredTeam === team.id ? "transform scale-[1.02]" : ""}
                      `}
                      onClick={() => setSelectedTeam(team.id)}
                      onMouseEnter={() => setHoveredTeam(team.id)}
                      onMouseLeave={() => setHoveredTeam(null)}
                    >
                      {/* Background Glow Effect */}
                      <div
                        className={`
                        absolute inset-0 rounded-2xl blur-xl transition-all duration-300
                        ${
                          selectedTeam === team.id
                            ? "bg-gradient-to-r from-purple-600/30 to-indigo-600/30"
                            : "bg-transparent"
                        }
                      `}
                      ></div>

                      {/* Main Card */}
                      <div
                        className={`
                        relative p-5 rounded-2xl border-2 transition-all duration-300
                        ${
                          selectedTeam === team.id
                            ? "border-purple-500 bg-gradient-to-r from-purple-50 to-indigo-50 shadow-xl"
                            : "border-gray-200 bg-white hover:border-purple-300 hover:shadow-lg"
                        }
                        ${isTop3 ? "bg-gradient-to-r from-yellow-50 to-amber-50" : ""}
                      `}
                      >
                        <div className="flex items-start gap-4">
                          {/* Rank Indicator */}
                          <div className="flex-shrink-0">
                            <div
                              className={`
                              w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg
                              ${index === 0 ? "bg-gradient-to-r from-yellow-400 to-yellow-500 text-white" : ""}
                              ${index === 1 ? "bg-gradient-to-r from-gray-400 to-gray-500 text-white" : ""}
                              ${index === 2 ? "bg-gradient-to-r from-orange-400 to-orange-500 text-white" : ""}
                              ${index > 2 ? "bg-gray-200 text-gray-600" : ""}
                            `}
                            >
                              {teamRank}
                            </div>
                            {isTop3 && (
                              <div className="text-center mt-1">
                                <span className="text-xs font-bold text-yellow-600">
                                  ⭐ FINALIST
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Radio Button */}
                          <div className="flex-shrink-0 pt-1">
                            <input
                              type="radio"
                              id={team.id}
                              name="team"
                              value={team.id}
                              checked={selectedTeam === team.id}
                              onChange={(e) =>
                                setSelectedTeam(e.target.value)
                              }
                              className="w-5 h-5 text-purple-600 focus:ring-purple-500"
                            />
                          </div>

                          {/* Team Info */}
                          <label
                            htmlFor={team.id}
                            className="flex-1 cursor-pointer"
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-bold text-lg text-gray-800">
                                {team.name}
                              </span>
                              {isTop3 && (
                                <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full font-medium">
                                  Top 3 Contender
                                </span>
                              )}
                            </div>
                            {team.description && (
                              <p className="text-sm text-gray-600 line-clamp-2">
                                {team.description}
                              </p>
                            )}

                            {/* Team Stats Tags */}
                            <div className="flex flex-wrap gap-2 mt-2">
                              <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                                ID: {team.id.slice(0, 6)}...
                              </span>
                              {currentRound === 2 && (
                                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                                  Round 2 Finalist
                                </span>
                              )}
                            </div>
                          </label>

                          {/* Selected Checkmark */}
                          {selectedTeam === team.id && (
                            <div className="flex-shrink-0">
                              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center animate-bounce-slow">
                                <svg
                                  className="w-5 h-5 text-white"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={3}
                                    d="M5 13l4 4L19 7"
                                  />
                                </svg>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Voting Info Card - Updated */}
              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-4 border border-purple-200">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">📢</span>
                  <div>
                    <p className="text-sm font-medium text-purple-800 mb-1">
                      Important:
                    </p>
                    <p className="text-xs text-purple-600">
                      {currentRound === 1
                        ? "You can vote multiple times in Round 1! Each vote helps determine which 6 teams advance to the finals."
                        : "This is the final round! You can vote multiple times. Each vote helps determine the top 3 champions."}
                    </p>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || !selectedTeam || !roundInfo.isActive}
                className="relative group w-full"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl blur-lg group-hover:blur-xl opacity-50 group-hover:opacity-75 transition-all duration-300"></div>
                <div className="relative w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:shadow-2xl transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed">
                  {loading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Submitting Vote...</span>
                    </div>
                  ) : !roundInfo.isActive ? (
                    `Voting Closed for Round ${currentRound}`
                  ) : (
                    `Submit Vote for Round ${currentRound}`
                  )}
                </div>
              </button>
            </form>
          )}
        </div>

        {/* Footer Info - Updated */}
        <div className="mt-6 text-center text-sm text-gray-400">
          <p>🗳️ Vote as many times as you want • Each vote counts towards the total</p>
        </div>
      </div>

      {/* Custom Scrollbar Styles */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #8c5bff, #6356d7);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #7b4aee, #5245c6);
        }
        @keyframes bounce-slow {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-5px);
          }
        }
        .animate-bounce-slow {
          animation: bounce-slow 2s infinite;
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}