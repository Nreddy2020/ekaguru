import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
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
        createLearner: jest.fn(),
        getLearnerMastery: jest.fn(),
        getLearnerSessions: jest.fn(),
        getSession: jest.fn(),
        getFrontier: jest.fn(),
        createSession: jest.fn(),
        startSession: jest.fn(),
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

    it("Dashboard should load and display active frontier targets dynamically", async () => {
        (api.getLearners as jest.Mock).mockResolvedValue({
            data: [{ id: "learner-leo", name: "Leo", learnerType: "CHILD" }],
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

        // Trigger start session
        const startBtn = screen.getByRole("button", { name: /START TODAY'S SESSION/i });
        fireEvent.click(startBtn);

        await waitFor(() => {
            expect(api.createSession).toHaveBeenCalledWith("learner-leo", 1, 30);
            expect(mockPush).toHaveBeenCalledWith("/student/session?sessionId=session-123");
        });
    });

    it("Session Player should execute targets and submit assessments to server", async () => {
        // Mock query sessionId in URL
        mockGetParam.mockReturnValue("session-123");

        const mockSession = {
            id: "session-123",
            status: "ACTIVE",
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
        (api.getStepContent as jest.Mock).mockResolvedValue({
            data: { conceptName: "Introduction to Fractions" },
        });
        (api.completeStep as jest.Mock).mockResolvedValue({});
        (api.getAssessmentInstance as jest.Mock).mockResolvedValue({
            data: {
                id: "inst-1",
                assessmentSpecification: {
                    configuration: {
                        question: "What is 1/2?",
                        options: ["0.5", "1.0", "0.0"],
                    },
                },
            },
        });
        (api.submitAssessmentResponse as jest.Mock).mockResolvedValue({
            data: { passed: true, rawScore: 1.0 },
        });
        (api.completeSession as jest.Mock).mockResolvedValue({});

        render(<TutorSession />);

        // Wait for session steps load
        await waitFor(() => {
            expect(screen.getByText("Introduction to Fractions")).toBeInTheDocument();
        });

        // Complete READ step
        const completeBtn = screen.getByRole("button", { name: /COMPLETE & CONTINUE/i });
        fireEvent.click(completeBtn);

        expect(api.completeStep).toHaveBeenCalledWith("session-123", "step-1");

        // Mock state updates for the next step refresh
        const sessionStep2 = {
            ...mockSession,
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

        // Simulate state reload
        mockGetParam.mockReturnValue("session-123");

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
