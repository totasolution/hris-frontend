import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';
import Select from 'react-select';
import { ButtonLink } from '../components/Button';
import { Card, CardBody } from '../components/Card';
import { PageHeader } from '../components/PageHeader';
import { Table, THead, TBody, TR, TH, TD } from '../components/Table';
import { useToast } from '../components/Toast';
import type { Candidate, Project, Client } from '../services/api';
import * as api from '../services/api';

type ViewMode = 'column' | 'list';

type Stage = {
  id: string;
  label: string;
  color: string;
};

const STAGES: Stage[] = [
  { id: 'new', label: 'New', color: 'bg-slate-100 text-slate-600' },
  { id: 'screening', label: 'Screening', color: 'bg-brand-lighter text-brand' },
  { id: 'screened_pass', label: 'Screened Pass', color: 'bg-green-50 text-green-700' },
  { id: 'screened_fail', label: 'Screened Fail', color: 'bg-red-50 text-red-700' },
  { id: 'submitted', label: 'Submitted to Client', color: 'bg-amber-50 text-amber-700' },
  { id: 'interview_scheduled', label: 'Interviewing', color: 'bg-purple-50 text-purple-700' },
  { id: 'interview_passed', label: 'Interview Passed', color: 'bg-emerald-50 text-emerald-700' },
  { id: 'interview_failed', label: 'Interview Failed', color: 'bg-rose-50 text-rose-700' },
  { id: 'onboarding', label: 'Onboarding', color: 'bg-teal-50 text-teal-700' },
  { id: 'onboarding_completed', label: 'Onboarding Done', color: 'bg-cyan-50 text-cyan-700' },
  { id: 'contract_requested', label: 'Contract Requested', color: 'bg-orange-50 text-orange-700' },
  { id: 'hired', label: 'Hired', color: 'bg-brand text-white' },
  { id: 'rejected', label: 'Rejected', color: 'bg-slate-200 text-slate-500' },
];

const customSelectStyles = {
  control: (base: any) => ({
    ...base,
    borderRadius: '0.75rem',
    border: '1px solid #e2e8f0',
    padding: '2px',
    boxShadow: 'none',
    '&:hover': {
      border: '1px solid #107BC7',
    },
  }),
  option: (base: any, state: any) => ({
    ...base,
    backgroundColor: state.isSelected ? '#107BC7' : state.isFocused ? '#E8F5FF' : 'white',
    color: state.isSelected ? 'white' : '#282828',
    fontSize: '0.875rem',
    fontWeight: '500',
  }),
  placeholder: (base: any) => ({
    ...base,
    fontSize: '0.875rem',
    color: '#94a3b8',
    fontWeight: '500',
  }),
  singleValue: (base: any) => ({
    ...base,
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#282828',
  }),
};

export default function RecruitmentBoardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [myActiveOnly, setMyActiveOnly] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    try {
      const saved = localStorage.getItem('recruitment-board-view');
      return (saved === 'list' || saved === 'column') ? saved : 'column';
    } catch {
      return 'column';
    }
  });
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    async function loadInitialData() {
      try {
        const [pList, cList] = await Promise.all([api.getProjects(), api.getClients()]);
        setProjects(pList);
        setClients(cList);
      } catch (err) {
        console.error('Failed to load projects/clients', err);
      } finally {
        setInitialLoading(false);
      }
    }
    loadInitialData();
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('recruitment-board-view', viewMode);
    } catch {
      /* ignore */
    }
  }, [viewMode]);

  useEffect(() => {
    async function loadCandidates() {
      setLoading(true);
      try {
        const params: any = {};
        if (selectedProjectId) params.project_id = parseInt(selectedProjectId, 10);
        if (selectedClientId) params.client_id = parseInt(selectedClientId, 10);
        if (myActiveOnly) params.my_active_only = true;
        const res = await api.getCandidates({ ...params, per_page: 1000 });
        setCandidates(res.data);
      } catch (err) {
        console.error('Failed to load candidates', err);
      } finally {
        setLoading(false);
      }
    }
    loadCandidates();
  }, [selectedProjectId, selectedClientId, myActiveOnly]);

  const filteredProjects = projects.filter(p => !selectedClientId || String(p.client_id) === selectedClientId);
  const selectedProject = projects.find(p => String(p.id) === selectedProjectId);
  const selectedClient = clients.find(c => String(c.id) === selectedClientId);

  const getCandidatesByStage = (stageId: string) => {
    return candidates.filter(c => c.screening_status === stageId);
  };

  const handleStatusChange = async (candidateId: number, newStatus: string) => {
    try {
      await api.updateCandidate(candidateId, { screening_status: newStatus });
      setCandidates(prev => prev.map(c => c.id === candidateId ? { ...c, screening_status: newStatus } : c));
      toast.success(`Candidate moved to ${newStatus.replace(/_/g, ' ')}`);
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const onDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const candidateId = parseInt(draggableId, 10);
    const newStatus = destination.droppableId;

    setCandidates(prev => prev.map(c => c.id === candidateId ? { ...c, screening_status: newStatus } : c));

    try {
      await api.updateCandidate(candidateId, { screening_status: newStatus });
      toast.success(`Candidate moved to ${newStatus.replace(/_/g, ' ')}`);
    } catch (err) {
      const params: any = {};
      if (selectedProjectId) params.project_id = parseInt(selectedProjectId, 10);
      if (selectedClientId) params.client_id = parseInt(selectedClientId, 10);
      if (myActiveOnly) params.my_active_only = true;
      const res = await api.getCandidates({ ...params, per_page: 1000 });
      setCandidates(res.data);
      toast.error('Failed to update candidate status');
    }
  };

  if (initialLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand"></div>
      </div>
    );
  }

  const clientOptions = clients.map(c => ({ value: String(c.id), label: c.name }));
  const projectOptions = filteredProjects.map(p => ({ value: String(p.id), label: p.name }));

  return (
    <div className="space-y-8 font-body">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex gap-2">
            <div className="w-64">
              <Select
                options={clientOptions}
                value={clientOptions.find(o => o.value === selectedClientId)}
                onChange={(option: any) => {
                  const val = option?.value || '';
                  setSelectedClientId(val);
                  setSelectedProjectId('');
                }}
                placeholder="All Clients"
                styles={customSelectStyles}
                isSearchable
                isClearable
              />
            </div>
            <div className="w-64">
              <Select
                options={projectOptions}
                value={projectOptions.find(o => o.value === selectedProjectId)}
                onChange={(option: any) => setSelectedProjectId(option?.value || '')}
                placeholder="All Projects"
                styles={customSelectStyles}
                isSearchable
                isClearable
                isDisabled={!selectedClientId}
              />
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={myActiveOnly}
              onChange={(e) => setMyActiveOnly(e.target.checked)}
              className="rounded border-slate-300 text-brand focus:ring-brand"
            />
            <span className="text-sm font-semibold text-slate-600">My active candidates only</span>
          </label>
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200/60">
            <button
              type="button"
              onClick={() => setViewMode('column')}
              className={`flex items-center justify-center p-2 rounded-lg transition-all ${
                viewMode === 'column'
                  ? 'bg-white text-brand shadow-sm border border-slate-200'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
              title="Column view"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`flex items-center justify-center p-2 rounded-lg transition-all ${
                viewMode === 'list'
                  ? 'bg-white text-brand shadow-sm border border-slate-200'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
              title="List view"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
        <ButtonLink to="/candidates/new">Add Candidate</ButtonLink>
      </div>

      {loading && candidates.length === 0 ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand"></div>
        </div>
      ) : viewMode === 'list' ? (
        <Card className="overflow-hidden">
          <Table>
            <THead>
              <TR>
                <TH>Name</TH>
                <TH>Email</TH>
                <TH>Client</TH>
                <TH>Project</TH>
                <TH>Stage</TH>
                <TH>PIC</TH>
                <TH>Rating</TH>
                <TH className="text-right">Actions</TH>
              </TR>
            </THead>
            <TBody>
              {candidates.length === 0 ? (
                <TR>
                  <TD colSpan={8} className="py-12 text-center text-slate-400">
                    No candidates found. Try adjusting your filters or add a new candidate.
                  </TD>
                </TR>
              ) : (
                candidates.map((c) => {
                  const stage = STAGES.find((s) => s.id === c.screening_status);
                  return (
                    <TR key={c.id}>
                      <TD>
                        <Link
                          to={`/candidates/${c.id}`}
                          className="font-bold text-brand-dark hover:text-brand transition-colors"
                        >
                          {c.full_name}
                        </Link>
                      </TD>
                      <TD className="text-slate-600">{c.email}</TD>
                      <TD>{c.client_name || '—'}</TD>
                      <TD>{c.project_name || '—'}</TD>
                      <TD>
                        <select
                          value={c.screening_status}
                          onChange={(e) => handleStatusChange(c.id, e.target.value)}
                          className={`text-xs font-bold px-3 py-1.5 rounded-lg border-0 cursor-pointer focus:ring-2 focus:ring-brand/20 outline-none ${stage?.color ?? 'bg-slate-100 text-slate-600'}`}
                        >
                          {STAGES.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.label}
                            </option>
                          ))}
                        </select>
                      </TD>
                      <TD>{c.pic_name || '—'}</TD>
                      <TD>
                        {c.screening_rating ? (
                          <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-lg text-amber-500 w-fit">
                            <svg className="w-3 h-3 fill-current" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            <span className="text-[10px] font-black">{c.screening_rating}</span>
                          </div>
                        ) : (
                          '—'
                        )}
                      </TD>
                      <TD className="text-right">
                        <Link
                          to={`/candidates/${c.id}`}
                          className="text-[10px] font-black text-slate-400 hover:text-brand uppercase tracking-[0.2em] transition-colors"
                        >
                          Details
                        </Link>
                      </TD>
                    </TR>
                  );
                })
              )}
            </TBody>
          </Table>
        </Card>
      ) : (
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex gap-6 overflow-x-auto pb-8 scrollbar-hide">
            {STAGES.map((stage) => {
              const stageCandidates = getCandidatesByStage(stage.id);
              return (
                <div key={stage.id} className="flex-shrink-0 w-80 space-y-6">
                  <div className="flex items-center justify-between px-4">
                    <div className="flex items-center gap-3">
                      <h3 className="font-black text-brand-dark text-xs uppercase tracking-[0.2em] font-headline">{stage.label}</h3>
                      <span className="bg-brand-lighter text-brand text-[10px] font-black px-2.5 py-1 rounded-lg shadow-sm">
                        {stageCandidates.length}
                      </span>
                    </div>
                  </div>

                  <Droppable droppableId={stage.id}>
                    {(provided, snapshot) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className={`space-y-4 min-h-[600px] p-4 rounded-[2rem] border-2 transition-all duration-300 ${
                          snapshot.isDraggingOver 
                            ? 'bg-brand-lighter/50 border-brand/30 shadow-inner' 
                            : 'bg-white/50 border-slate-100 shadow-sm'
                        }`}
                      >
                        {stageCandidates.length === 0 && !snapshot.isDraggingOver ? (
                          <div className="py-12 text-center flex flex-col items-center justify-center space-y-3">
                            <div className="h-10 w-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-200">
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                              </svg>
                            </div>
                            <p className="text-[10px] text-slate-300 uppercase font-black tracking-[0.2em]">Empty</p>
                          </div>
                        ) : (
                          stageCandidates.map((c, index) => (
                            <Draggable key={c.id} draggableId={String(c.id)} index={index}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className="outline-none"
                                >
                                  <Card className={`group transition-all duration-300 ${
                                    snapshot.isDragging 
                                      ? 'shadow-2xl ring-4 ring-brand/20 rotate-3 scale-105 z-50' 
                                      : 'hover:shadow-xl hover:-translate-y-1 border-slate-100'
                                  }`}>
                                    <CardBody className="!p-5 space-y-4">
                                      <div className="flex justify-between items-start">
                                        <Link 
                                          to={`/candidates/${c.id}`} 
                                          className="font-bold text-brand-dark hover:text-brand transition-colors text-sm leading-tight font-headline"
                                          onClick={(e) => snapshot.isDragging && e.preventDefault()}
                                        >
                                          {c.full_name}
                                        </Link>
                                        {c.screening_rating && (
                                          <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-lg text-amber-500">
                                            <svg className="w-3 h-3 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                                            <span className="text-[10px] font-black">{c.screening_rating}</span>
                                          </div>
                                        )}
                                      </div>
                                      
                                      <div className="flex flex-col gap-1">
                                        <p className="text-[10px] text-slate-400 font-bold truncate tracking-wider">{c.email}</p>
                                        <div className="flex flex-col gap-0.5 mt-1">
                                          <span className="text-[9px] font-black text-brand uppercase tracking-tight">{c.client_name || 'No Client'}</span>
                                          <span className="text-[9px] text-slate-400 font-bold tracking-tight">{c.project_name || 'No Project'}</span>
                                        </div>
                                        {c.pic_name && (
                                          <div className="flex items-center gap-1.5 mt-1">
                                            <div className="h-4 w-4 rounded-full bg-brand/10 flex items-center justify-center text-[8px] font-black text-brand">
                                              {c.pic_name.charAt(0)}
                                            </div>
                                            <p className="text-[10px] text-slate-400 font-bold tracking-tight">PIC: {c.pic_name}</p>
                                          </div>
                                        )}
                                      </div>

                                      <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                                        <div className="flex gap-2">
                                          {STAGES.findIndex(s => s.id === stage.id) < STAGES.length - 1 && (
                                            <button
                                              onClick={() => handleStatusChange(c.id, STAGES[STAGES.findIndex(s => s.id === stage.id) + 1].id)}
                                              className="p-2 text-slate-300 hover:text-brand hover:bg-brand-lighter rounded-xl transition-all"
                                              title="Move to next stage"
                                            >
                                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                              </svg>
                                            </button>
                                          )}
                                        </div>
                                        <Link
                                          to={`/candidates/${c.id}`}
                                          className="text-[10px] font-black text-slate-400 hover:text-brand uppercase tracking-[0.2em] transition-colors"
                                          onClick={(e) => snapshot.isDragging && e.preventDefault()}
                                        >
                                          Details
                                        </Link>
                                      </div>
                                    </CardBody>
                                  </Card>
                                </div>
                              )}
                            </Draggable>
                          ))
                        )}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>
              );
            })}
          </div>
        </DragDropContext>
      )}
    </div>
  );
}
