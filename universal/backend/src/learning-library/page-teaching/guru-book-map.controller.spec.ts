import { GuruBookMapController } from './guru-book-map.controller';
import { GuruBookMapService } from './guru-book-map.service';

describe('GuruBookMapController', () => {
  let controller: GuruBookMapController;
  let mockService: any;

  beforeEach(() => {
    mockService = {
      getOrBuildBookMap: jest.fn().mockResolvedValue({
        version: 'book-map-v1',
        bookId: 'evs-class-5',
        title: 'Environmental Studies',
        chapters: [],
        dependencies: [],
      }),
      getTopicDependencies: jest.fn().mockResolvedValue({
        topicId: 't-1',
        prerequisites: [],
        dependents: [],
      }),
      getRevisitGuidance: jest.fn().mockResolvedValue({
        currentPage: 3,
        recommendedPage: 2,
        hasPrerequisite: true,
        reason: 'Review foundational concepts on page 2.',
      }),
    };

    controller = new GuruBookMapController(mockService as GuruBookMapService);
  });

  it('GET :bookId/map calls getOrBuildBookMap', async () => {
    const result = await controller.getBookMap('evs-class-5');
    expect(result.bookId).toBe('evs-class-5');
    expect(mockService.getOrBuildBookMap).toHaveBeenCalledWith('evs-class-5', false);
  });

  it('GET :bookId/map?refresh=1 calls getOrBuildBookMap with forceRefresh=true', async () => {
    await controller.getBookMap('evs-class-5', '1');
    expect(mockService.getOrBuildBookMap).toHaveBeenCalledWith('evs-class-5', true);
  });

  it('GET :bookId/topics/:topicId/dependencies queries topic dependencies', async () => {
    const result = await controller.getTopicDependencies('evs-class-5', 't-1');
    expect(result.topicId).toBe('t-1');
    expect(mockService.getTopicDependencies).toHaveBeenCalledWith('evs-class-5', 't-1');
  });

  it('GET :bookId/pages/:page/revisit parses page number and returns guidance', async () => {
    const result = await controller.getRevisitGuidance('evs-class-5', '3');
    expect(result.recommendedPage).toBe(2);
    expect(mockService.getRevisitGuidance).toHaveBeenCalledWith('evs-class-5', 3, undefined);
  });
});
