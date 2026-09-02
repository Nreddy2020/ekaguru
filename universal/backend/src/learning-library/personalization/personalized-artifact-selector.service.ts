import { Injectable, Logger } from '@nestjs/common';
import { TeachingPackageRecord } from '../ai-factory/content-factory.service';
import { LearnerProfileRecord } from './learner-profile.service';
import { PedagogicalDepth } from './diagnostic-assessment.service';

export interface SelectedArtifactBundle {
  targetDepth: PedagogicalDepth;
  primaryArtifact: {
    artifactType: string;
    title: string;
    content: any;
  };
  supportingArtifact: {
    artifactType: string;
    title: string;
    content: any;
  };
  rationale: string;
}

@Injectable()
export class PersonalizedArtifactSelectorService {
  private readonly logger = new Logger(PersonalizedArtifactSelectorService.name);

  public selectPersonalizedArtifacts(
    teachingPackage: TeachingPackageRecord,
    learnerProfile: LearnerProfileRecord,
    currentDepth: PedagogicalDepth
  ): SelectedArtifactBundle {
    const depthPackage = teachingPackage.depths[currentDepth];

    // Select primary and supporting artifacts based on preferred modality
    let primaryArtifact: any;
    let supportingArtifact: any;
    let rationale = '';

    switch (learnerProfile.preferredModality) {
      case 'VISUAL':
        primaryArtifact = {
          artifactType: 'boardSummary',
          title: 'Visual Blackboard Diagram',
          content: depthPackage.boardSummary,
        };
        supportingArtifact = {
          artifactType: 'visuals',
          title: 'Interactive Visual Flow',
          content: depthPackage.visuals,
        };
        rationale = 'Visual learner: prioritized high-contrast blackboard illustrations and diagrammatic visual steps.';
        break;

      case 'READING':
        primaryArtifact = {
          artifactType: 'teacherExplanation',
          title: 'Detailed Textual Walkthrough',
          content: depthPackage.teacherExplanation,
        };
        supportingArtifact = {
          artifactType: 'printableNotes',
          title: 'Comprehensive Study Notes',
          content: depthPackage.printableNotes,
        };
        rationale = 'Reading/Verbal learner: prioritized structured narrative explanations and analytical study notes.';
        break;

      case 'INTERACTIVE':
      default:
        primaryArtifact = {
          artifactType: 'realWorldExamples',
          title: 'Real-World Application Challenge',
          content: depthPackage.realWorldExamples,
        };
        supportingArtifact = {
          artifactType: 'keyPoints',
          title: 'Core Principles Summary',
          content: depthPackage.keyPoints,
        };
        rationale = 'Interactive learner: prioritized real-world problem scenarios backed by key principles.';
        break;
    }

    return {
      targetDepth: currentDepth,
      primaryArtifact,
      supportingArtifact,
      rationale,
    };
  }
}
