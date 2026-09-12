import { Agent } from "./agent.model";
import { IAgent } from "./agent.interface";
import QueryBuilder from "../../builder/QueryBuilder";


const createAgent = async (payload: Partial<IAgent>) => {
  const result = await Agent.create(payload);
  return result;
};

const getAllAgents = async (query: Record<string, unknown>) => {
  const agentQuery = new QueryBuilder(Agent.find().populate("image"), query)
    .search(["name", "role", "patch", "languages"])
    .filter()
    .sort()
    .paginate()
    .fields();

  const result = await agentQuery.modelQuery;
  const meta = await agentQuery.countTotal();

  return {
    meta,
    data: result,
  };
};

const getSingleAgent = async (id: string) => {
  const result = await Agent.findById(id).populate("image");
  return result;
};

const updateAgent = async (id: string, payload: Partial<IAgent>) => {
  const result = await Agent.findByIdAndUpdate(id, payload, {
    new: true,
  }).populate("image");
  return result;
};

const deleteAgent = async (id: string) => {
  const result = await Agent.findByIdAndUpdate(
    id,
    { isDeleted: true },
    { new: true }
  );
  return result;
};

export const AgentService = {
  createAgent,
  getAllAgents,
  getSingleAgent,
  updateAgent,
  deleteAgent,
};
