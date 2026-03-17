# LangGraph AI Workflow Orchestration

## 技术栈

- **LangGraph**: 状态图工作流编排框架
- **LangChain**: LLM应用框架
- **Python 3.11+**: 运行时环境
- **TypeScript/Python**: 支持双语言
- **LangSmith**: 调试与监控

## 项目结构

```
langgraph-project/
├── src/
│   ├── agents/              # Agent定义
│   │   ├── __init__.py
│   │   ├── base.py          # 基础Agent
│   │   ├── research.py      # 研究Agent
│   │   └── writer.py        # 写作Agent
│   ├── graphs/              # 工作流图定义
│   │   ├── __init__.py
│   │   ├── state.py         # 状态定义
│   │   ├── nodes.py         # 节点函数
│   │   └── workflow.py      # 主工作流
│   ├── tools/               # 工具函数
│   │   ├── __init__.py
│   │   ├── search.py        # 搜索工具
│   │   └── calculator.py    # 计算工具
│   ├── memory/              # 记忆管理
│   │   ├── __init__.py
│   │   └── checkpointer.py  # 状态持久化
│   └── main.py              # 入口文件
├── tests/
│   ├── test_agents.py
│   └── test_graphs.py
├── pyproject.toml
├── langgraph.json           # LangGraph配置
└── .env
```

## 代码模式

### 状态定义

```python
from typing import TypedDict, Annotated, Sequence
from langgraph.graph import add_messages
from langchain_core.messages import BaseMessage

class AgentState(TypedDict):
    """工作流状态"""
    messages: Annotated[Sequence[BaseMessage], add_messages]
    next_agent: str
    research_data: str
    final_output: str
```

### 节点函数

```python
from langchain_core.messages import HumanMessage, AIMessage

def research_node(state: AgentState) -> dict:
    """研究节点"""
    messages = state["messages"]
    # 执行研究逻辑
    research_result = "Research findings..."
    return {
        "research_data": research_result,
        "next_agent": "writer"
    }

def writer_node(state: AgentState) -> dict:
    """写作节点"""
    research_data = state["research_data"]
    # 生成最终输出
    output = f"Based on research: {research_data}"
    return {
        "final_output": output,
        "next_agent": "end"
    }
```

### 工作流图构建

```python
from langgraph.graph import StateGraph, END
from langgraph.checkpoint.memory import MemorySaver

def create_workflow():
    """创建工作流图"""
    workflow = StateGraph(AgentState)
    
    # 添加节点
    workflow.add_node("researcher", research_node)
    workflow.add_node("writer", writer_node)
    
    # 设置入口
    workflow.set_entry_point("researcher")
    
    # 添加边
    workflow.add_edge("researcher", "writer")
    workflow.add_edge("writer", END)
    
    # 编译（带检查点）
    memory = MemorySaver()
    return workflow.compile(checkpointer=memory)

# 使用
app = create_workflow()
result = app.invoke({
    "messages": [HumanMessage(content="Write about AI")]
})
```

### 条件路由

```python
def router(state: AgentState) -> str:
    """条件路由"""
    if state["next_agent"] == "end":
        return END
    return state["next_agent"]

workflow.add_conditional_edges(
    "researcher",
    router,
    {"writer": "writer", "end": END}
)
```

### 工具集成

```python
from langchain_core.tools import tool

@tool
def search_web(query: str) -> str:
    """搜索网络"""
    # 实现搜索逻辑
    return f"Results for: {query}"

# 在Agent中使用
from langchain.agents import create_tool_calling_agent
from langchain_openai import ChatOpenAI

llm = ChatOpenAI(model="gpt-4")
tools = [search_web]
agent = create_tool_calling_agent(llm, tools)
```

### 人机协作（Human-in-the-loop）

```python
from langgraph.checkpoint.memory import MemorySaver
from langgraph.pregel import GraphRecursionError

# 编译时启用中断
app = workflow.compile(
    checkpointer=MemorySaver(),
    interrupt_before=["writer"]  # 在writer节点前中断
)

# 执行到中断点
config = {"configurable": {"thread_id": "thread-1"}}
result = app.invoke(initial_state, config)

# 人工审核后继续
app.invoke(None, config)  # 继续执行
```

## 最佳实践

### 1. 状态设计

```python
# ✅ 明确的状态类型
class GoodState(TypedDict):
    messages: Annotated[list, add_messages]
    context: dict
    metadata: dict

# ❌ 避免过度复杂的状态
class BadState(TypedDict):
    everything: dict  # 太模糊
```

### 2. 错误处理

```python
from langgraph.pregel import GraphRecursionError

def safe_node(state: State) -> dict:
    try:
        # 节点逻辑
        return {"result": process(state)}
    except Exception as e:
        return {"error": str(e), "next_agent": "error_handler"}

# 添加错误处理节点
workflow.add_node("error_handler", handle_error)
```

### 3. 状态持久化

```python
from langgraph.checkpoint.sqlite import SqliteSaver

# SQLite持久化
with SqliteSaver.from_conn_string("checkpoints.db") as checkpointer:
    app = workflow.compile(checkpointer=checkpointer)
    
    # 恢复执行
    config = {"configurable": {"thread_id": "user-123"}}
    result = app.invoke(state, config)
```

### 4. 并行执行

```python
from langgraph.graph import StateGraph

def parallel_workflow():
    workflow = StateGraph(State)
    
    workflow.add_node("a", node_a)
    workflow.add_node("b", node_b)
    workflow.add_node("c", node_c)
    workflow.add_node("merge", merge_node)
    
    # a和b并行执行
    workflow.set_entry_point("a")
    workflow.add_edge("a", "c")
    workflow.add_edge("b", "c")
    workflow.add_edge("c", "merge")
    
    return workflow.compile()
```

### 5. 子图嵌套

```python
# 定义子图
sub_graph = StateGraph(SubState)
sub_graph.add_node("sub_a", sub_node_a)
sub_graph.add_node("sub_b", sub_node_b)
sub_graph.add_edge("sub_a", "sub_b")
sub_app = sub_graph.compile()

# 在主图中使用
main_graph = StateGraph(MainState)
main_graph.add_node("subworkflow", sub_app)
```

## 常用命令

```bash
# 安装依赖
pip install langgraph langchain-openai

# 开发模式
python -m src.main

# 运行测试
pytest tests/ -v

# LangGraph Studio（可视化调试）
langgraph dev

# 部署到LangGraph Cloud
langgraph deploy

# 查看运行历史
langgraph runs list

# 环境变量
export OPENAI_API_KEY="your-key"
export LANGCHAIN_TRACING_V2="true"
export LANGCHAIN_API_KEY="your-key"
```

## 部署配置

### langgraph.json

```json
{
  "python_version": "3.11",
  "dependencies": [
    "langgraph>=0.2.0",
    "langchain-openai>=0.2.0",
    "langchain-core>=0.3.0"
  ],
  "graphs": {
    "agent": "./src/graphs/workflow.py:create_workflow"
  },
  "env": ".env"
}
```

### Docker部署

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

# LangGraph Server
CMD ["langgraph", "start", "--host", "0.0.0.0", "--port", "8000"]
```

### Docker Compose

```yaml
version: '3.8'
services:
  langgraph:
    build: .
    ports:
      - "8000:8000"
    environment:
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - LANGCHAIN_TRACING_V2=true
      - LANGCHAIN_API_KEY=${LANGCHAIN_API_KEY}
    volumes:
      - ./checkpoints:/app/checkpoints
```

### LangGraph Cloud部署

```bash
# 登录LangSmith
langgraph login

# 部署
langgraph deploy --name my-workflow

# 更新部署
langgraph deploy --update

# 查看日志
langgraph logs
```

### API调用

```python
import requests

# LangGraph Cloud API
response = requests.post(
    "https://your-deployment.langgraph.cloud/runs",
    json={
        "assistant_id": "agent",
        "input": {
            "messages": [{"role": "user", "content": "Hello"}]
        }
    }
)

run_id = response.json()["run_id"]

# 获取结果
result = requests.get(
    f"https://your-deployment.langgraph.cloud/runs/{run_id}"
)
```

### Kubernetes部署

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: langgraph-server
spec:
  replicas: 3
  selector:
    matchLabels:
      app: langgraph
  template:
    metadata:
      labels:
        app: langgraph
    spec:
      containers:
      - name: langgraph
        image: langgraph-server:latest
        ports:
        - containerPort: 8000
        env:
        - name: OPENAI_API_KEY
          valueFrom:
            secretKeyRef:
              name: langgraph-secrets
              key: openai-api-key
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "2Gi"
            cpu: "2000m"
```

## 监控与调试

```python
# LangSmith追踪
from langsmith import Client

client = Client()
runs = client.list_runs(
    project_name="my-project",
    run_type="llm"
)

# 自定义回调
from langchain.callbacks.base import BaseCallbackHandler

class CustomHandler(BaseCallbackHandler):
    def on_llm_start(self, serialized, prompts, **kwargs):
        print(f"LLM started with prompts: {prompts}")
    
    def on_llm_end(self, response, **kwargs):
        print(f"LLM ended: {response}")

# 使用回调
app.invoke(state, config={"callbacks": [CustomHandler()]})
```
