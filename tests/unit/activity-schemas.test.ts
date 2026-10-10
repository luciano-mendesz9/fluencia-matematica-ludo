import { describe, expect, it } from "vitest";
import { activityDraftSchema, activityLifecycleSchema } from "../../src/features/activities/schemas";

const id="00000000-0000-4000-8000-000000000001";
describe("activity input schemas",()=>{
  it("requires a positive target and stable ids",()=>{expect(activityDraftSchema.safeParse({classId:id,schoolId:id,title:"Prática",targetCount:20,questionVersionIds:[id]}).success).toBe(true);expect(activityDraftSchema.safeParse({classId:id,schoolId:id,title:"Prática",targetCount:0,questionVersionIds:[]}).success).toBe(false);});
  it("rejects stale-shaped lifecycle input",()=>{expect(activityLifecycleSchema.safeParse({activityId:id,revision:1}).success).toBe(true);expect(activityLifecycleSchema.safeParse({activityId:id,revision:0}).success).toBe(false);});
});
