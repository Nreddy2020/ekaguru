import { VitalisLabDataProvider } from './lab-provider';
import { VitalisDemoDataProvider } from './demo-provider';
import { VitalisEnvironment } from '../domain/types';

export const LabProvider = VitalisLabDataProvider;
export const DemoProvider = VitalisDemoDataProvider;

const labProviderInstance = new VitalisLabDataProvider();
const demoProviderInstance = new VitalisDemoDataProvider();

export function getVitalisProvider(env: VitalisEnvironment): any {
  switch (env) {
    case 'DEMO':
      return demoProviderInstance;
    case 'LAB':
    default:
      return labProviderInstance;
  }
}

