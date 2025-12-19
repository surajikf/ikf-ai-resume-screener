import Head from "next/head";
import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import CandidateList from "@/components/CandidateList";
import CandidateDetailCard from "@/components/CandidateDetailCard";
import ResumeViewer from "@/components/ResumeViewer";
import EmptyState from "@/components/EmptyState";
import { fetchJSON } from "@/utils/fetchWithRetry";
import logger from "@/utils/logger";
import {
  FaSearch,
  FaFilter,
  FaSort,
  FaTimes,
  FaUsers,
  FaSpinner,
  FaArrowLeft,
  FaSync,
  FaBriefcase,
  FaMapMarkerAlt,
  FaBuilding,
  FaChartLine,
  FaAward,
} from "react-icons/fa";

export default function CandidateDatabase() {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [verdictFilter, setVerdictFilter] = useState("all"); // Default: show all candidates
  const [sortBy, setSortBy] = useState("latest_evaluation");
  const [sortOrder, setSortOrder] = useState("DESC");
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [selectedResume, setSelectedResume] = useState(null);
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 100, // Increased limit to show more candidates per page
    offset: 0,
    hasMore: false,
  });
  const [minExperience, setMinExperience] = useState("");
  const [maxExperience, setMaxExperience] = useState("");
  const [minMatchScore, setMinMatchScore] = useState("");
  const [maxMatchScore, setMaxMatchScore] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [companyFilter, setCompanyFilter] = useState("");
  const [designationFilter, setDesignationFilter] = useState("");

  const fetchCandidates = useCallback(async (resetOffset = false, currentOffset = null) => {
    try {
      setLoading(true);
      setError("");

      const offsetToUse = resetOffset ? 0 : (currentOffset !== null ? currentOffset : pagination.offset);

      const params = new URLSearchParams({
        limit: pagination.limit.toString(),
        offset: offsetToUse.toString(),
        sortBy,
        sortOrder,
      });

      if (searchTerm.trim()) {
        params.append("search", searchTerm.trim());
      }

      // Only send verdict parameter if it's not "all" - this ensures all candidates are shown by default
      if (verdictFilter && verdictFilter !== "all") {
        params.append("verdict", verdictFilter);
      }

      const { data, response } = await fetchJSON(`/api/candidates/database?${params.toString()}`, {}, { maxRetries: 2 });
      
      if (!response.ok || !data.success) {
        const errorMsg = data.error || data.details || `HTTP error! status: ${response.status}`;
        logger.error('API Error Response', 'CandidateDatabase', {
          status: response.status,
          statusText: response.statusText,
          error: data.error,
          details: data.details,
        });
        throw new Error(errorMsg);
      }
      
      logger.debug('API Response', 'CandidateDatabase', {
        dataLength: data.data?.length || 0,
        total: data.pagination?.total || 0,
        hasMore: data.pagination?.hasMore || false,
      });

      if (!data.success) {
        throw new Error(data.error || "Failed to fetch candidates");
      }

      if (resetOffset) {
        setCandidates(data.data || []);
        setPagination((prev) => ({
          ...prev,
          total: data.pagination?.total || 0,
          offset: 0,
          hasMore: data.pagination?.hasMore || false,
        }));
      } else {
        setCandidates((prev) => [...prev, ...(data.data || [])]);
        setPagination((prev) => ({
          ...prev,
          total: data.pagination?.total || 0,
          offset: offsetToUse,
          hasMore: data.pagination?.hasMore || false,
        }));
      }
    } catch (err) {
      logger.error("Error fetching candidates", 'CandidateDatabase', err);
      setError(err.message || "Failed to load candidates. Please try again.");
      if (resetOffset) {
        setCandidates([]);
      }
    } finally {
      setLoading(false);
    }
  }, [searchTerm, verdictFilter, sortBy, sortOrder, pagination.limit, minExperience, maxExperience, minMatchScore, maxMatchScore, locationFilter, companyFilter, designationFilter]);

  useEffect(() => {
    logger.debug('useEffect triggered - fetching candidates with filters', 'CandidateDatabase', {
      searchTerm,
      verdictFilter,
      sortBy,
      sortOrder,
    });
    fetchCandidates(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, verdictFilter, sortBy, sortOrder]);

  const handleLoadMore = () => {
    if (!loading && pagination.hasMore) {
      const newOffset = pagination.offset + pagination.limit;
      fetchCandidates(false, newOffset);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchCandidates(true);
  };

  const handleViewResume = (evaluation) => {
    if (evaluation && evaluation.hasResume && evaluation.evaluationId) {
      setSelectedResume({
        evaluationId: evaluation.evaluationId,
        candidateName: selectedCandidate?.candidateName || "Candidate",
      });
    }
  };

  const handleViewResumeFromList = (candidate) => {
    if (candidate.evaluations && candidate.evaluations.length > 0) {
      const evalWithResume = candidate.evaluations.find(e => e.hasResume);
      if (evalWithResume) {
        setSelectedResume({
          evaluationId: evalWithResume.evaluationId,
          candidateName: candidate.candidateName || "Candidate",
        });
      }
    }
  };

  const handleCloseResume = () => {
    setSelectedResume(null);
  };

  const handleSelectCandidate = (candidate) => {
    setSelectedCandidate(candidate);
  };

  const handleCloseDetail = () => {
    setSelectedCandidate(null);
  };

  const handleSortChange = (newSortBy, newSortOrder) => {
    setSortBy(newSortBy);
    setSortOrder(newSortOrder);
    // This will trigger useEffect to refetch with new sort
  };

  return (
    <>
      <Head>
        <title>Candidate Database - Resume Screener</title>
        <meta name="description" content="View all evaluated candidates with their complete profile and evaluation history" />
      </Head>

      <div className="min-h-screen bg-slate-50 w-full overflow-x-hidden">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-white border-b border-slate-200 shadow-sm">
          <div className="w-full px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:border-blue-300"
                  title="Back to Home"
                >
                  <FaArrowLeft />
                  Back
                </Link>
                <FaUsers className="text-2xl text-blue-600" />
                <h1 className="text-2xl font-bold text-slate-900">Candidate Database</h1>
                {pagination.total > 0 && (
                  <span className="text-sm text-slate-500">
                    ({pagination.total} candidate{pagination.total !== 1 ? "s" : ""})
                  </span>
                )}
                {verdictFilter !== "all" && (
                  <span className="px-2.5 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full border border-blue-200">
                    Filtered: {verdictFilter}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => fetchCandidates(true)}
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Refresh candidate list"
                >
                  <FaSync className={loading ? "animate-spin" : ""} />
                  Refresh
                </button>
              </div>
            </div>

          </div>
        </header>

        {/* Main Content */}
        <main className="w-full px-4 sm:px-6 lg:px-8 py-6">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          {/* Sticky Filter Panel - Full Width with Glossy Background */}
          <div className="sticky top-[73px] z-20 mb-4 backdrop-blur-md bg-white/90 border-b border-slate-200/50 shadow-lg transition-all duration-300">
            <div className="px-4 sm:px-6 lg:px-8 py-3">
              {/* All Filters in Single Line - Full Width Grid */}
              <form onSubmit={handleSearch} className="grid grid-cols-12 gap-3 items-end">
                {/* Global Search - Takes 2 columns */}
                <div className="flex flex-col col-span-12 md:col-span-2">
                  <label className="text-[10px] font-semibold text-slate-700 uppercase tracking-wide mb-1 flex items-center gap-1.5">
                    <FaSearch className="text-blue-500 text-xs" />
                    Search
                  </label>
                  <div className="relative">
                    <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 text-xs" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Name, email, phone..."
                      className="w-full pl-9 pr-9 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/95 backdrop-blur-sm h-[38px] transition-all"
                    />
                    {searchTerm && (
                      <button
                        type="button"
                        onClick={() => {
                          setSearchTerm("");
                          fetchCandidates(true);
                        }}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        <FaTimes className="text-xs" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Status Filter - Takes 1 column */}
                <div className="flex flex-col col-span-6 md:col-span-1">
                  <label className="text-[10px] font-semibold text-slate-700 uppercase tracking-wide mb-1 flex items-center gap-1.5">
                    <FaAward className="text-blue-500 text-xs" />
                    Status
                  </label>
                  <select
                    value={verdictFilter}
                    onChange={(e) => setVerdictFilter(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/95 backdrop-blur-sm h-[38px] transition-all"
                  >
                    <option value="all">All</option>
                    <option value="Recommended">🟢 Recommended</option>
                    <option value="Partially Suitable">🟠 Partial</option>
                    <option value="Not Suitable">🔴 Not Suitable</option>
                  </select>
                </div>

                {/* Match Score Range - Takes 2 columns */}
                <div className="flex flex-col col-span-6 md:col-span-2">
                  <label className="text-[10px] font-semibold text-slate-700 uppercase tracking-wide mb-1">Score %</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={minMatchScore}
                      onChange={(e) => setMinMatchScore(e.target.value)}
                      placeholder="Min"
                      className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/95 backdrop-blur-sm h-[38px] transition-all"
                    />
                    <span className="text-slate-400 text-sm font-medium">-</span>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={maxMatchScore}
                      onChange={(e) => setMaxMatchScore(e.target.value)}
                      placeholder="Max"
                      className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/95 backdrop-blur-sm h-[38px] transition-all"
                    />
                  </div>
                </div>

                {/* Experience Range - Takes 2 columns */}
                <div className="flex flex-col col-span-6 md:col-span-2">
                  <label className="text-[10px] font-semibold text-slate-700 uppercase tracking-wide mb-1 flex items-center gap-1.5">
                    <FaBriefcase className="text-blue-500 text-xs" />
                    Experience
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      max="50"
                      step="0.5"
                      value={minExperience}
                      onChange={(e) => setMinExperience(e.target.value)}
                      placeholder="Min Yrs"
                      className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/95 backdrop-blur-sm h-[38px] transition-all"
                    />
                    <span className="text-slate-400 text-sm font-medium">-</span>
                    <input
                      type="number"
                      min="0"
                      max="50"
                      step="0.5"
                      value={maxExperience}
                      onChange={(e) => setMaxExperience(e.target.value)}
                      placeholder="Max Yrs"
                      className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/95 backdrop-blur-sm h-[38px] transition-all"
                    />
                  </div>
                </div>

                {/* Location - Takes 1 column */}
                <div className="flex flex-col col-span-6 md:col-span-1">
                  <label className="text-[10px] font-semibold text-slate-700 uppercase tracking-wide mb-1 flex items-center gap-1.5">
                    <FaMapMarkerAlt className="text-blue-500 text-xs" />
                    Location
                  </label>
                  <input
                    type="text"
                    value={locationFilter}
                    onChange={(e) => setLocationFilter(e.target.value)}
                    placeholder="City/State"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/95 backdrop-blur-sm h-[38px] transition-all"
                  />
                </div>

                {/* Company - Takes 1 column */}
                <div className="flex flex-col col-span-6 md:col-span-1">
                  <label className="text-[10px] font-semibold text-slate-700 uppercase tracking-wide mb-1">Company</label>
                  <input
                    type="text"
                    value={companyFilter}
                    onChange={(e) => setCompanyFilter(e.target.value)}
                    placeholder="Company"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/95 backdrop-blur-sm h-[38px] transition-all"
                  />
                </div>

                {/* Designation - Takes 1 column */}
                <div className="flex flex-col col-span-6 md:col-span-1">
                  <label className="text-[10px] font-semibold text-slate-700 uppercase tracking-wide mb-1 flex items-center gap-1.5">
                    <FaBuilding className="text-blue-500 text-xs" />
                    Role
                  </label>
                  <input
                    type="text"
                    value={designationFilter}
                    onChange={(e) => setDesignationFilter(e.target.value)}
                    placeholder="Job Title"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/95 backdrop-blur-sm h-[38px] transition-all"
                  />
                </div>

                {/* Sort - Takes 2 columns */}
                <div className="flex flex-col col-span-6 md:col-span-2">
                  <label className="text-[10px] font-semibold text-slate-700 uppercase tracking-wide mb-1">Sort By</label>
                  <div className="flex items-center gap-2">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/95 backdrop-blur-sm h-[38px] transition-all"
                    >
                      <option value="latest_evaluation">Latest Eval</option>
                      <option value="candidate_name">Name</option>
                      <option value="total_evaluations">Evals</option>
                      <option value="candidate_created_at">Date Added</option>
                      <option value="total_experience_years">Experience</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => setSortOrder(sortOrder === "ASC" ? "DESC" : "ASC")}
                      className="px-3 py-2 border border-slate-300 rounded-lg bg-white/95 backdrop-blur-sm hover:bg-white hover:border-blue-400 text-sm transition-all flex items-center justify-center min-w-[42px] h-[38px] flex-shrink-0 shadow-sm"
                      title={`Sort ${sortOrder === "ASC" ? "Descending" : "Ascending"}`}
                    >
                      <FaSort className={sortOrder === "ASC" ? "transform rotate-180" : ""} />
                    </button>
                  </div>
                </div>
              </form>

              {/* Clear All Button - Positioned separately */}
              <div className="flex justify-end mt-2">
                <button
                  type="button"
                  onClick={() => {
                    setVerdictFilter("all");
                    setMinExperience("");
                    setMaxExperience("");
                    setMinMatchScore("");
                    setMaxMatchScore("");
                    setLocationFilter("");
                    setCompanyFilter("");
                    setDesignationFilter("");
                    setSearchTerm("");
                  }}
                  className="px-4 py-1.5 text-xs font-medium border border-slate-300 rounded-lg bg-white/95 backdrop-blur-sm hover:bg-white hover:border-red-300 hover:text-red-600 text-slate-700 flex items-center gap-2 transition-all shadow-sm"
                >
                  <FaTimes className="text-xs" />
                  Clear All Filters
                </button>
              </div>

              {/* Active Filters - Compact Row Below */}
              {((verdictFilter !== "all") || minExperience || maxExperience || minMatchScore || maxMatchScore || locationFilter || companyFilter || designationFilter || searchTerm) && (
                <div className="flex items-center gap-2 flex-wrap pt-3 mt-3 border-t border-slate-200/50">
                  <span className="text-[10px] font-semibold text-slate-700 uppercase tracking-wide">Active Filters:</span>
                  {searchTerm && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium bg-blue-100 text-blue-700 rounded-full border border-blue-200">
                      Search: {searchTerm}
                      <button
                        type="button"
                        onClick={() => {
                          setSearchTerm("");
                          fetchCandidates(true);
                        }}
                        className="hover:text-blue-900"
                      >
                        <FaTimes className="text-[10px]" />
                      </button>
                    </span>
                  )}
                  {verdictFilter !== "all" && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium bg-blue-100 text-blue-700 rounded-full border border-blue-200">
                      {verdictFilter}
                      <button onClick={() => setVerdictFilter("all")} className="hover:text-blue-900">
                        <FaTimes className="text-[10px]" />
                      </button>
                    </span>
                  )}
                  {(minExperience || maxExperience) && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium bg-blue-100 text-blue-700 rounded-full border border-blue-200">
                      Exp: {minExperience || "0"}-{maxExperience || "∞"}Y
                      <button
                        onClick={() => {
                          setMinExperience("");
                          setMaxExperience("");
                        }}
                        className="hover:text-blue-900"
                      >
                        <FaTimes className="text-[10px]" />
                      </button>
                    </span>
                  )}
                  {(minMatchScore || maxMatchScore) && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium bg-blue-100 text-blue-700 rounded-full border border-blue-200">
                      Score: {minMatchScore || "0"}-{maxMatchScore || "100"}%
                      <button
                        onClick={() => {
                          setMinMatchScore("");
                          setMaxMatchScore("");
                        }}
                        className="hover:text-blue-900"
                      >
                        <FaTimes className="text-[10px]" />
                      </button>
                    </span>
                  )}
                  {locationFilter && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium bg-blue-100 text-blue-700 rounded-full border border-blue-200">
                      📍 {locationFilter}
                      <button onClick={() => setLocationFilter("")} className="hover:text-blue-900">
                        <FaTimes className="text-[10px]" />
                      </button>
                    </span>
                  )}
                  {companyFilter && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium bg-blue-100 text-blue-700 rounded-full border border-blue-200">
                      🏢 {companyFilter}
                      <button onClick={() => setCompanyFilter("")} className="hover:text-blue-900">
                        <FaTimes className="text-[10px]" />
                      </button>
                    </span>
                  )}
                  {designationFilter && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium bg-blue-100 text-blue-700 rounded-full border border-blue-200">
                      💼 {designationFilter}
                      <button onClick={() => setDesignationFilter("")} className="hover:text-blue-900">
                        <FaTimes className="text-[10px]" />
                      </button>
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {loading && candidates.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <FaSpinner className="text-4xl text-blue-600 animate-spin mb-4" />
              <p className="text-slate-600">Loading candidates...</p>
            </div>
          ) : candidates.length === 0 ? (
            <div className="text-center py-12">
              <FaUsers className="text-6xl text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-700 mb-2">No Candidates Found</h3>
              <p className="text-slate-500">
                {searchTerm || verdictFilter !== "all"
                  ? "Try adjusting your search or filters."
                  : "No candidates have been evaluated yet."}
              </p>
            </div>
          ) : (
            <>
              <CandidateList
                candidates={candidates}
                onSelectCandidate={handleSelectCandidate}
                onViewResume={handleViewResumeFromList}
                loading={loading}
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSortChange={handleSortChange}
              />

              {pagination.hasMore && (
                <div className="mt-6 text-center">
                  <div className="mb-2 text-sm text-slate-600">
                    Showing {candidates.length} of {pagination.total} candidates
                  </div>
                  <button
                    onClick={handleLoadMore}
                    disabled={loading}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <FaSpinner className="animate-spin" />
                        Loading...
                      </span>
                    ) : (
                      `Load More (${pagination.total - candidates.length} remaining)`
                    )}
                  </button>
                </div>
              )}
              {!pagination.hasMore && candidates.length > 0 && (
                <div className="mt-4 text-center text-sm text-slate-600">
                  Showing all {candidates.length} candidate{candidates.length !== 1 ? 's' : ''}
                </div>
              )}
            </>
          )}
        </main>

        {/* Candidate Detail Modal */}
        {selectedCandidate && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 py-4">
              <div
                className="fixed inset-0 bg-black bg-opacity-50"
                onClick={handleCloseDetail}
              ></div>
              <div className="relative bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-hidden">
                <CandidateDetailCard
                  candidate={selectedCandidate}
                  onClose={handleCloseDetail}
                  onViewResume={handleViewResume}
                />
              </div>
            </div>
          </div>
        )}

        {/* Resume Viewer */}
        {selectedResume && (
          <ResumeViewer
            evaluationId={selectedResume.evaluationId}
            candidateName={selectedResume.candidateName}
            onClose={handleCloseResume}
          />
        )}
      </div>
    </>
  );
}

