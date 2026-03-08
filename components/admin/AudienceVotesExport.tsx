"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";

interface VoteRecord {
  id: string;
  round: number;
  votedAt: string;
  voter: {
    id: string;
    name: string;
    email: string;
    pgp: string | null;
    section: string | null;
    role: string;
    registeredAt: string;
  };
  team: {
    id: string;
    name: string;
  };
  votingSession: {
    startTime: string | null;
    endTime: string | null;
    wasActive: boolean;
  } | null;
}

interface Summary {
  totalVotes: number;
  uniqueVoters: number;
  votesPerRound: Record<number, number>;
  votersPerRound: Record<number, number>;
}

export default function AudienceVotesExport() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [selectedRound, setSelectedRound] = useState<string>("all");
  const [voteData, setVoteData] = useState<{
    votes: VoteRecord[];
    summary: Summary;
  } | null>(null);
  const [message, setMessage] = useState({ type: "", text: "" });

  if (!session || session.user?.role !== "ADMIN") {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="text-center py-8">
          <div className="text-4xl mb-4">🔒</div>
          <p className="text-gray-600">Admin access required</p>
        </div>
      </div>
    );
  }

  const fetchVoteData = async () => {
    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const res = await fetch(
        `/api/admin/audience-votes?round=${selectedRound}`,
      );
      if (!res.ok) throw new Error("Failed to fetch vote data");

      const data = await res.json();
      setVoteData(data);
    } catch (error: any) {
      console.error("Error fetching vote data:", error);
      setMessage({
        type: "error",
        text: error.message || "Failed to load vote data",
      });
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    if (!voteData) return;

    setExportLoading(true);
    try {
      // Define CSV headers
      const headers = [
        "Round",
        "Voter Name",
        "Voter Email",
        "PGP",
        "Section",
        "Voter Role",
        "Team Voted For",
        "Vote Time",
        "Registration Date",
        "Voting Session Start",
        "Voting Session End",
        "Was Voting Active",
      ];

      // Convert votes to CSV rows
      const rows = voteData.votes.map((vote) => [
        vote.round,
        vote.voter.name,
        vote.voter.email,
        vote.voter.pgp || "N/A",
        vote.voter.section || "N/A",
        vote.voter.role,
        vote.team.name,
        new Date(vote.votedAt).toLocaleString(),
        new Date(vote.voter.registeredAt).toLocaleDateString(),
        vote.votingSession?.startTime
          ? new Date(vote.votingSession.startTime).toLocaleString()
          : "N/A",
        vote.votingSession?.endTime
          ? new Date(vote.votingSession.endTime).toLocaleString()
          : "N/A",
        vote.votingSession?.wasActive ? "Yes" : "No",
      ]);

      // Combine headers and rows
      const csvContent = [
        headers.join(","),
        ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
      ].join("\n");

      // Create download link
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);

      // Set filename
      const date = new Date().toISOString().split("T")[0];
      const roundText =
        selectedRound === "all" ? "all_rounds" : `round_${selectedRound}`;
      link.setAttribute("href", url);
      link.setAttribute("download", `audience_votes_${roundText}_${date}.csv`);
      link.style.visibility = "hidden";

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setMessage({ type: "success", text: "CSV exported successfully!" });
      setTimeout(() => setMessage({ type: "", text: "" }), 3000);
    } catch (error) {
      console.error("Error exporting CSV:", error);
      setMessage({ type: "error", text: "Failed to export CSV" });
    } finally {
      setExportLoading(false);
    }
  };

  const exportToJSON = () => {
    if (!voteData) return;

    setExportLoading(true);
    try {
      // Create export data with metadata
      const exportData = {
        exportedAt: new Date().toISOString(),
        filters: {
          round: selectedRound,
        },
        summary: voteData.summary,
        votes: voteData.votes,
      };

      // Create download link
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: "application/json",
      });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);

      // Set filename
      const date = new Date().toISOString().split("T")[0];
      const roundText =
        selectedRound === "all" ? "all_rounds" : `round_${selectedRound}`;
      link.setAttribute("href", url);
      link.setAttribute("download", `audience_votes_${roundText}_${date}.json`);
      link.style.visibility = "hidden";

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setMessage({ type: "success", text: "JSON exported successfully!" });
      setTimeout(() => setMessage({ type: "", text: "" }), 3000);
    } catch (error) {
      console.error("Error exporting JSON:", error);
      setMessage({ type: "error", text: "Failed to export JSON" });
    } finally {
      setExportLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg p-2">
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
              d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-gray-800">
          Audience Voting Details
        </h3>
      </div>

      {message.text && (
        <div
          className={`mb-4 p-3 rounded-lg text-sm ${
            message.type === "success"
              ? "bg-green-50 text-green-700 border-l-4 border-green-500"
              : "bg-red-50 text-red-700 border-l-4 border-red-500"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="space-y-4">
        {/* Filter Section */}
        <div className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Round
            </label>
            <select
              value={selectedRound}
              onChange={(e) => setSelectedRound(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">All Rounds</option>
              <option value="1">Round 1</option>
              <option value="2">Round 2</option>
              <option value="3">Round 3</option>
            </select>
          </div>

          <button
            onClick={fetchVoteData}
            disabled={loading}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Loading...</span>
              </>
            ) : (
              <>
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <span>Load Data</span>
              </>
            )}
          </button>
        </div>

        {/* Summary Cards */}
        {voteData && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
              <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-purple-600">
                  {voteData.summary.totalVotes}
                </p>
                <p className="text-xs text-gray-600">Total Votes</p>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-blue-600">
                  {voteData.summary.uniqueVoters}
                </p>
                <p className="text-xs text-gray-600">Unique Voters</p>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-green-600">
                  {Object.keys(voteData.summary.votesPerRound).length}
                </p>
                <p className="text-xs text-gray-600">Rounds with Votes</p>
              </div>
              <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-orange-600">
                  {voteData.votes.length}
                </p>
                <p className="text-xs text-gray-600">Records Loaded</p>
              </div>
            </div>

            {/* Votes Per Round Breakdown */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-700 mb-3">
                Votes per Round
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[1, 2, 3].map((round) => (
                  <div
                    key={round}
                    className="bg-white rounded-lg p-3 shadow-sm"
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-700">
                        Round {round}
                      </span>
                      <span className="text-lg font-bold text-purple-600">
                        {voteData.summary.votesPerRound[round] || 0}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {voteData.summary.votersPerRound[round] || 0} unique
                      voters
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Export Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-end mt-4">
              <button
                onClick={exportToCSV}
                disabled={exportLoading}
                className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:shadow-lg transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {exportLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Exporting...</span>
                  </>
                ) : (
                  <>
                    <span>📊</span>
                    <span>Export as CSV</span>
                  </>
                )}
              </button>
              <button
                onClick={exportToJSON}
                disabled={exportLoading}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:shadow-lg transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {exportLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Exporting...</span>
                  </>
                ) : (
                  <>
                    <span>📋</span>
                    <span>Export as JSON</span>
                  </>
                )}
              </button>
            </div>

            {/* Data Preview Table */}
            <div className="mt-4 overflow-x-auto border rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Round
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Voter
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Email
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Team
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Time
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {voteData.votes.slice(0, 5).map((vote) => (
                    <tr key={vote.id}>
                      <td className="px-4 py-2 text-sm">Round {vote.round}</td>
                      <td className="px-4 py-2 text-sm font-medium">
                        {vote.voter.name}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-600">
                        {vote.voter.email}
                      </td>
                      <td className="px-4 py-2 text-sm text-purple-600">
                        {vote.team.name}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-500">
                        {new Date(vote.votedAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                  {voteData.votes.length > 5 && (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-4 py-2 text-sm text-center text-gray-500"
                      >
                        ... and {voteData.votes.length - 5} more records
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
