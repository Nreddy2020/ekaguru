import { IVitalisDataProvider } from './vitalis-data-provider.interface';
import { LabProvider } from './lab-provider';
import { DemoProvider } from './demo-provider';
import { VitalisEnvironment } from '../domain/types';

const labProviderInstance = new LabProvider();
const demoProviderInstance = new DemoProvider();

export function getVitalisProvider(env: VitalisEnvironment): IVitalisDataProvider {
  switch (env) {
    case 'DEMO':
      return demoProviderInstance;
    case 'LAB':
    default:
      return labProviderInstance;
  }
}
