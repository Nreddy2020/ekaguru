import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import StudentWelcomePage from "../welcome/page";
import TutorSession from "./page";
import { api } from "../../../lib/api-client";

// Mock Next.js Navigation
const mockPush = jest.fn();
const mockGetParam = jest.fn().mockReturnValue(null);
jest.mock("next/navigation", () => ({
    useRouter: () => ({
        push: mockPush,
    }),
    useSearchParams: () => ({
        get: mockGetParam,
    }),
}));

// Mock API client methods
jest.mock("../../../lib/api-client", () => ({
    api: {
        getLearners: jest.fn(),
        getLearner: jest.fn(),
        getLearnerMastery: jest.fn(),
        getLearnerSessions: jest.fn(),
        getSession: jest.fn(),
        getFrontier: jest.fn(),
        createSession: jest.fn(),
        startSession: jest.fn(),
        pauseSession: jest.fn(),
        resumeSession: jest.fn(),
        completeStep: jest.fn(),
        getStepContent: jest.fn(),
        getAssessmentInstance: jest.fn(),
        submitAssessmentResponse: jest.fn(),
        completeSession: jest.fn(),
    },
}));

describe("Phase 2.9 UI component tests", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("Dashboard should show onboarding if no learner profile exists", async () => {
        (api.getLearners as jest.Mock).mockResolvedValue({ data: [] });

        render(<StudentWelcomePage />);

        await waitFor(() => {
            expect(screen.getByText("No Active Learner Found")).toBeInTheDocument();
        });
    });

    it("Dashboard should load and display active frontier targets dynamically from enrollment", async () => {
        (api.getLearners as jest.Mock).mockResolvedValue({
            data: [
                {
                    id: "learner-leo",
                    name: "Leo",
                    learnerType: "CHILD",
                    curriculumEnrollments: [
                        { active: true, structure: { id: "struct-1", version: 2 } },
                    ],
                },
            ],
        });
        (api.getLearnerMastery as jest.Mock).mockResolvedValue({
            data: [{ id: "cm-1", status: "MASTERED" }],
        });
        (api.getLearnerSessions as jest.Mock).mockResolvedValue({
            data: [], // No active sessions initially
        });
        (api.getFrontier as jest.Mock).mockResolvedValue({
            data: {
                frontierNodes: [
                    { id: "node-3", gradeBand: "PRIMARY", concept: { canonicalName: "Fractions In Action" } },
                ],
            },
        });
        (api.createSession as jest.Mock).mockResolvedValue({
            id: "session-123",
        });

        render(<StudentWelcomePage />);

        // Verify dynamic loader initially
        expect(screen.getByText(/Synchronizing Learner Profile.../i)).toBeInTheDocument();

        // Wait for dynamic profile load
        await waitFor(() => {
            expect(screen.getByText("Leo")).toBeInTheDocument();
            expect(screen.getByText("1 Concepts Mastered")).toBeInTheDocument();
            expect(screen.getByText("Fractions In Action")).toBeInTheDocument();
        });

        // Verify time budget select exists
        const budgetSelect = screen.getByRole("combobox");
        expect(budgetSelect).toBeInTheDocument();
        fireEvent.change(budgetSelect, { target: { value: "45" } });

        // Trigger start session
        const startBtn = screen.getByRole("button", { name: /START TODAY'S SESSION/i });
        fireEvent.click(startBtn);

        await waitFor(() => {
            // Version resolved dynamically from active enrollment (version = 2), time budget resolved from selector (45)
            expect(api.createSession).toHaveBeenCalledWith("learner-leo", 2, 45);
            expect(mockPush).toHaveBeenCalledWith("/student/session?sessionId=session-123");
        });
    });

    it("Session Player should require start, support pause/resume, and submit assessments to server", async () => {
        mockGetParam.mockReturnValue("session-123");

        const mockSession = {
            id: "session-123",
            status: "READY",
            timeBudgetSeconds: 1800,
            targets: [
                {
                    id: "target-1",
                    steps: [
                        { id: "step-1", stepType: "READ", status: "PENDING" },
                        { id: "step-2", stepType: "ASSESS", status: "PENDING", assessmentInstances: [{ id: "inst-1" }] },
                    ],
                },
            ],
        };

        (api.getSession as jest.Mock).mockResolvedValue({ data: mockSession });
        (api.startSession as jest.Mock).mockResolvedValue({});
        (api.pauseSession as jest.Mock).mockResolvedValue({});
        (api.resumeSession as jest.Mock).mockResolvedValue({});
        (api.getStepContent as jest.Mock).mockResolvedValue({
            data: { conceptName: "Introduction to Fractions" },
        });
        (api.completeStep as jest.Mock).mockResolvedValue({});
        (api.getAssessmentInstance as jest.Mock).mockResolvedValue({
            data: {
                instanceId: "inst-1",
                status: "PENDING",
                attemptNumber: 1,
                assessmentType: "MULTIPLE_CHOICE",
                difficulty: 1,
                configuration: {
                    question: "What is 1/2?",
                    options: ["0.5", "1.0", "0.0"],
                },
            },
        });
        (api.submitAssessmentResponse as jest.Mock).mockResolvedValue({
            data: { passed: true, rawScore: 1.0 },
        });
        (api.completeSession as jest.Mock).mockResolvedValue({});

        render(<TutorSession />);

        // Verify explicit start session screen
        await waitFor(() => {
            expect(screen.getByText("Your Learning Session is Ready")).toBeInTheDocument();
        });

        // Click Start Session
        const startBtn = screen.getByRole("button", { name: /START LEARNING SESSION/i });
        const activeSession = { ...mockSession, status: "ACTIVE" };
        (api.getSession as jest.Mock).mockResolvedValue({ data: activeSession });
        fireEvent.click(startBtn);

        await waitFor(() => {
            expect(api.startSession).toHaveBeenCalledWith("session-123");
        });

        // Wait for session steps load in ACTIVE mode
        await waitFor(() => {
            expect(screen.getByText("Introduction to Fractions")).toBeInTheDocument();
        });

        // Trigger Pause Session
        const pauseBtn = screen.getByRole("button", { name: /PAUSE/i });
        const pausedSession = { ...mockSession, status: "PAUSED" };
        (api.getSession as jest.Mock).mockResolvedValue({ data: pausedSession });
        fireEvent.click(pauseBtn);

        await waitFor(() => {
            expect(api.pauseSession).toHaveBeenCalledWith("session-123");
            expect(screen.getByText("Session Paused")).toBeInTheDocument();
        });

        // Trigger Resume Session
        const resumeBtn = screen.getByRole("button", { name: /RESUME/i });
        (api.getSession as jest.Mock).mockResolvedValue({ data: activeSession });
        fireEvent.click(resumeBtn);

        await waitFor(() => {
            expect(api.resumeSession).toHaveBeenCalledWith("session-123");
        });

        // Complete READ step
        await waitFor(() => {
            expect(screen.getByText("Introduction to Fractions")).toBeInTheDocument();
        });
        const completeBtn = screen.getByRole("button", { name: /COMPLETE & CONTINUE/i });
        fireEvent.click(completeBtn);

        expect(api.completeStep).toHaveBeenCalledWith("session-123", "step-1");

        // Mock state updates for the next step refresh
        const sessionStep2 = {
            ...mockSession,
            status: "ACTIVE",
            targets: [
                {
                    id: "target-1",
                    steps: [
                        { id: "step-1", stepType: "READ", status: "COMPLETED" },
                        { id: "step-2", stepType: "ASSESS", status: "PENDING", assessmentInstances: [{ id: "inst-1" }] },
                    ],
                },
            ],
        };
        (api.getSession as jest.Mock).mockResolvedValue({ data: sessionStep2 });

        // Force state reload
        act(() => {
            mockGetParam.mockReturnValue("session-123");
        });

        // Wait for ASSESS step load
        await waitFor(() => {
            expect(screen.getByText("Question: What is 1/2?")).toBeInTheDocument();
        });

        // Answer Question
        const optionBtn = screen.getByRole("button", { name: "0.5" });
        fireEvent.click(optionBtn);

        const submitBtn = screen.getByRole("button", { name: /SUBMIT ANSWER/i });
        fireEvent.click(submitBtn);

        await waitFor(() => {
            expect(api.submitAssessmentResponse).toHaveBeenCalledWith("session-123", "inst-1", "0.5");
        });
    });
});
