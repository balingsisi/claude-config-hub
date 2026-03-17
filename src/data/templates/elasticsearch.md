# Elasticsearch 搜索引擎模板

## 技术栈

- **核心**: Elasticsearch 8.11+
- **客户端**: Official Clients (JavaScript, Python, Java, Go)
- **可视化**: Kibana
- **日志收集**: Filebeat / Logstash
- **监控**: Elastic Stack Monitoring
- **语言**: Node.js / Python / Java / Go
- **容器化**: Docker / Kubernetes

## 项目结构

```
elasticsearch-project/
├── config/
│   ├── elasticsearch.yml       # ES 配置
│   ├── kibana.yml             # Kibana 配置
│   └── logstash.conf          # Logstash 管道
├── mappings/
│   ├── user.json              # 用户索引映射
│   ├── product.json           # 产品索引映射
│   └── article.json           # 文章索引映射
├── scripts/
│   ├── create-index.js        # 创建索引脚本
│   ├── bulk-import.js         # 批量导入脚本
│   ├── reindex.js             # 重建索引脚本
│   └── backup.sh              # 备份脚本
├── src/
│   ├── client/
│   │   ├── elastic.js         # ES 客户端配置
│   │   └── connection.js      # 连接池管理
│   ├── services/
│   │   ├── search.service.js  # 搜索服务
│   │   ├── index.service.js   # 索引管理服务
│   │   └── aggregation.service.js
│   ├── repositories/
│   │   ├── user.repository.js
│   │   └── product.repository.js
│   ├── utils/
│   │   ├── query-builder.js   # 查询构建器
│   │   └── analyzer.js        # 分析器配置
│   └── app.js
├── tests/
│   ├── search.test.js
│   └── index.test.js
├── docker-compose.yml
├── .env
├── package.json
└── README.md
```

## 代码模式

### 1. 客户端配置

```javascript
// src/client/elastic.js
import { Client } from '@elastic/elasticsearch';

const client = new Client({
  node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
  auth: {
    username: process.env.ELASTIC_USER || 'elastic',
    password: process.env.ELASTIC_PASSWORD || 'changeme',
  },
  maxRetries: 5,
  requestTimeout: 60000,
  sniffOnStart: true, // 启动时发现节点
  sniffInterval: 300000, // 每5分钟发现一次
  ssl: {
    rejectUnauthorized: false, // 开发环境禁用证书验证
  },
});

// 健康检查
async function checkHealth() {
  try {
    const health = await client.cluster.health();
    console.log('Cluster health:', health.status);
    return health;
  } catch (error) {
    console.error('Health check failed:', error.message);
    throw error;
  }
}

export { client, checkHealth };
```

### 2. 索引映射

```json
// mappings/product.json
{
  "settings": {
    "number_of_shards": 3,
    "number_of_replicas": 1,
    "analysis": {
      "analyzer": {
        "product_analyzer": {
          "type": "custom",
          "tokenizer": "standard",
          "filter": [
            "lowercase",
            "asciifolding",
            "edge_ngram_filter"
          ]
        },
        "product_search_analyzer": {
          "type": "custom",
          "tokenizer": "standard",
          "filter": [
            "lowercase",
            "asciifolding"
          ]
        }
      },
      "filter": {
        "edge_ngram_filter": {
          "type": "edge_ngram",
          "min_gram": 2,
          "max_gram": 20
        }
      }
    }
  },
  "mappings": {
    "properties": {
      "id": {
        "type": "keyword"
      },
      "name": {
        "type": "text",
        "analyzer": "product_analyzer",
        "search_analyzer": "product_search_analyzer",
        "fields": {
          "keyword": {
            "type": "keyword",
            "ignore_above": 256
          },
          "completion": {
            "type": "completion",
            "analyzer": "simple"
          }
        }
      },
      "description": {
        "type": "text",
        "analyzer": "standard"
      },
      "price": {
        "type": "scaled_float",
        "scaling_factor": 100
      },
      "category": {
        "type": "keyword"
      },
      "tags": {
        "type": "keyword"
      },
      "brand": {
        "type": "keyword"
      },
      "stock": {
        "type": "integer"
      },
      "rating": {
        "type": "float"
      },
      "reviews_count": {
        "type": "integer"
      },
      "created_at": {
        "type": "date",
        "format": "strict_date_optional_time||epoch_millis"
      },
      "updated_at": {
        "type": "date",
        "format": "strict_date_optional_time||epoch_millis"
      },
      "location": {
        "type": "geo_point"
      },
      "attributes": {
        "type": "nested",
        "properties": {
          "name": { "type": "keyword" },
          "value": { "type": "keyword" }
        }
      },
      "suggest": {
        "type": "completion",
        "analyzer": "simple"
      }
    }
  }
}
```

### 3. 创建索引

```javascript
// src/services/index.service.js
import { client } from '../client/elastic.js';
import productMapping from '../../mappings/product.json' assert { type: 'json' };

class IndexService {
  
  // 创建索引
  async createIndex(indexName, mapping) {
    const exists = await client.indices.exists({ index: indexName });
    
    if (exists) {
      console.log(`Index ${indexName} already exists`);
      return false;
    }
    
    await client.indices.create({
      index: indexName,
      body: mapping,
    });
    
    console.log(`Index ${indexName} created successfully`);
    return true;
  }
  
  // 删除索引
  async deleteIndex(indexName) {
    const exists = await client.indices.exists({ index: indexName });
    
    if (!exists) {
      console.log(`Index ${indexName} does not exist`);
      return false;
    }
    
    await client.indices.delete({ index: indexName });
    console.log(`Index ${indexName} deleted successfully`);
    return true;
  }
  
  // 更新映射
  async updateMapping(indexName, mapping) {
    await client.indices.putMapping({
      index: indexName,
      body: mapping,
    });
    
    console.log(`Mapping for ${indexName} updated successfully`);
  }
  
  // 获取映射
  async getMapping(indexName) {
    const response = await client.indices.getMapping({ index: indexName });
    return response[indexName].mappings;
  }
  
  // 重建索引
  async reindex(sourceIndex, targetIndex) {
    const response = await client.reindex({
      wait_for_completion: false,
      body: {
        source: {
          index: sourceIndex,
        },
        dest: {
          index: targetIndex,
        },
      },
    });
    
    console.log('Reindex task started:', response.task);
    return response.task;
  }
  
  // 初始化所有索引
  async initializeIndices() {
    const indices = [
      { name: 'products', mapping: productMapping },
      // 添加更多索引...
    ];
    
    for (const { name, mapping } of indices) {
      await this.createIndex(name, mapping);
    }
  }
}

export default new IndexService();
```

### 4. 文档操作

```javascript
// src/services/document.service.js
import { client } from '../client/elastic.js';

class DocumentService {
  
  // 索引单个文档
  async indexDocument(index, id, document) {
    const response = await client.index({
      index,
      id,
      body: document,
      refresh: true, // 立即刷新（仅用于测试）
    });
    
    return response;
  }
  
  // 批量索引文档
  async bulkIndex(index, documents) {
    const body = documents.flatMap((doc) => [
      { index: { _index: index, _id: doc.id } },
      doc,
    ]);
    
    const response = await client.bulk({
      body,
      refresh: true,
    });
    
    if (response.errors) {
      const errors = response.items.filter((item) => item.index.error);
      console.error('Bulk index errors:', errors);
    }
    
    return response;
  }
  
  // 获取文档
  async getDocument(index, id) {
    try {
      const response = await client.get({
        index,
        id,
      });
      
      return response._source;
    } catch (error) {
      if (error.statusCode === 404) {
        return null;
      }
      throw error;
    }
  }
  
  // 更新文档
  async updateDocument(index, id, partialDocument) {
    const response = await client.update({
      index,
      id,
      body: {
        doc: partialDocument,
        doc_as_upsert: true, // 如果不存在则插入
      },
      refresh: true,
    });
    
    return response;
  }
  
  // 删除文档
  async deleteDocument(index, id) {
    const response = await client.delete({
      index,
      id,
      refresh: true,
    });
    
    return response;
  }
  
  // 批量删除
  async deleteByQuery(index, query) {
    const response = await client.deleteByQuery({
      index,
      body: {
        query,
      },
      refresh: true,
    });
    
    return response;
  }
}

export default new DocumentService();
```

### 5. 搜索服务

```javascript
// src/services/search.service.js
import { client } from '../client/elastic.js';

class SearchService {
  
  // 基础搜索
  async search(index, query, options = {}) {
    const {
      from = 0,
      size = 10,
      sort,
      source,
      aggs,
    } = options;
    
    const response = await client.search({
      index,
      body: {
        query,
        from,
        size,
        ...(sort && { sort }),
        ...(source && { _source: source }),
        ...(aggs && { aggs }),
      },
    });
    
    return {
      total: response.hits.total.value,
      hits: response.hits.hits.map((hit) => ({
        ...hit._source,
        _score: hit._score,
        _id: hit._id,
      })),
      aggregations: response.aggregations,
    };
  }
  
  // 全文搜索
  async fullTextSearch(index, field, text, options = {}) {
    const query = {
      bool: {
        must: [
          {
            match: {
              [field]: {
                query: text,
                fuzziness: 'AUTO',
                operator: 'and',
              },
            },
          },
        ],
      },
    };
    
    return this.search(index, query, options);
  }
  
  // 多字段搜索
  async multiFieldSearch(index, fields, text, options = {}) {
    const query = {
      multi_match: {
        query: text,
        fields,
        type: 'best_fields',
        fuzziness: 'AUTO',
      },
    };
    
    return this.search(index, query, options);
  }
  
  // 过滤搜索
  async filteredSearch(index, filters, options = {}) {
    const must = [];
    const filter = [];
    
    if (filters.text) {
      must.push({
        multi_match: {
          query: filters.text,
          fields: filters.fields || ['*'],
        },
      });
    }
    
    if (filters.category) {
      filter.push({ term: { category: filters.category } });
    }
    
    if (filters.priceRange) {
      filter.push({
        range: {
          price: {
            gte: filters.priceRange.min,
            lte: filters.priceRange.max,
          },
        },
      });
    }
    
    if (filters.tags && filters.tags.length > 0) {
      filter.push({ terms: { tags: filters.tags } });
    }
    
    const query = {
      bool: {
        must,
        filter,
      },
    };
    
    return this.search(index, query, options);
  }
  
  // 嵌套对象搜索
  async nestedSearch(index, path, query, options = {}) {
    const searchQuery = {
      nested: {
        path,
        query,
      },
    };
    
    return this.search(index, searchQuery, options);
  }
  
  // 地理位置搜索
  async geoSearch(index, lat, lon, distance, options = {}) {
    const query = {
      bool: {
        filter: [
          {
            geo_distance: {
              distance,
              location: { lat, lon },
            },
          },
        ],
      },
    };
    
    return this.search(index, query, {
      ...options,
      sort: [
        {
          _geo_distance: {
            location: { lat, lon },
            order: 'asc',
            unit: 'km',
          },
        },
      ],
    });
  }
  
  // 自动补全
  async autocomplete(index, field, prefix, options = {}) {
    const { size = 10 } = options;
    
    const response = await client.search({
      index,
      body: {
        suggest: {
          suggestions: {
            prefix,
            completion: {
              field: `${field}.completion`,
              size,
              skip_duplicates: true,
              fuzzy: {
                fuzziness: 'AUTO',
              },
            },
          },
        },
      },
    });
    
    return response.suggest.suggestions[0].options.map((option) => ({
      text: option.text,
      source: option._source,
    }));
  }
  
  // 高亮搜索
  async highlightSearch(index, query, fields, options = {}) {
    const searchQuery = {
      match: query,
    };
    
    const response = await client.search({
      index,
      body: {
        query: searchQuery,
        highlight: {
          fields: fields.reduce((acc, field) => {
            acc[field] = {
              pre_tags: ['<em>'],
              post_tags: ['</em>'],
            };
            return acc;
          }, {}),
        },
      },
    });
    
    return response.hits.hits.map((hit) => ({
      ...hit._source,
      highlight: hit.highlight,
    }));
  }
}

export default new SearchService();
```

### 6. 聚合查询

```javascript
// src/services/aggregation.service.js
import { client } from '../client/elastic.js';

class AggregationService {
  
  // 统计聚合
  async statsAggregation(index, field) {
    const response = await client.search({
      index,
      body: {
        size: 0,
        aggs: {
          stats: {
            stats: { field },
          },
        },
      },
    });
    
    return response.aggregations.stats;
  }
  
  // 词项聚合
  async termsAggregation(index, field, size = 10) {
    const response = await client.search({
      index,
      body: {
        size: 0,
        aggs: {
          terms: {
            terms: {
              field,
              size,
              order: { _count: 'desc' },
            },
          },
        },
      },
    });
    
    return response.aggregations.terms.buckets.map((bucket) => ({
      key: bucket.key,
      count: bucket.doc_count,
    }));
  }
  
  // 范围聚合
  async rangeAggregation(index, field, ranges) {
    const response = await client.search({
      index,
      body: {
        size: 0,
        aggs: {
          ranges: {
            range: {
              field,
              ranges,
            },
          },
        },
      },
    });
    
    return response.aggregations.ranges.buckets;
  }
  
  // 日期直方图
  async dateHistogram(index, field, interval = '1d') {
    const response = await client.search({
      index,
      body: {
        size: 0,
        aggs: {
          histogram: {
            date_histogram: {
              field,
              calendar_interval: interval,
            },
          },
        },
      },
    });
    
    return response.aggregations.histogram.buckets;
  }
  
  // 嵌套聚合
  async nestedAggregation(index, path, aggs) {
    const response = await client.search({
      index,
      body: {
        size: 0,
        aggs: {
          nested: {
            nested: { path },
            aggs,
          },
        },
      },
    });
    
    return response.aggregations.nested;
  }
  
  // 过滤聚合
  async filterAggregation(index, filter, aggs) {
    const response = await client.search({
      index,
      body: {
        size: 0,
        aggs: {
          filtered: {
            filter,
            aggs,
          },
        },
      },
    });
    
    return response.aggregations.filtered;
  }
  
  // 复合聚合（分类统计 + 平均值）
  async compositeAggregation(index) {
    const response = await client.search({
      index,
      body: {
        size: 0,
        aggs: {
          categories: {
            terms: {
              field: 'category',
              size: 10,
            },
            aggs: {
              avg_price: {
                avg: { field: 'price' },
              },
              total_sales: {
                sum: { field: 'sales' },
              },
            },
          },
        },
      },
    });
    
    return response.aggregations.categories.buckets.map((bucket) => ({
      category: bucket.key,
      count: bucket.doc_count,
      avgPrice: bucket.avg_price.value,
      totalSales: bucket.total_sales.value,
    }));
  }
}

export default new AggregationService();
```

### 7. 查询构建器

```javascript
// src/utils/query-builder.js
class QueryBuilder {
  constructor() {
    this.query = {
      bool: {
        must: [],
        must_not: [],
        should: [],
        filter: [],
      },
    };
    this.sortArray = [];
    this.fromValue = 0;
    this.sizeValue = 10;
    this.aggsObject = {};
  }
  
  // 全文匹配
  match(field, value, options = {}) {
    this.query.bool.must.push({
      match: {
        [field]: {
          query: value,
          ...options,
        },
      },
    });
    return this;
  }
  
  // 精确匹配
  term(field, value) {
    this.query.bool.filter.push({
      term: { [field]: value },
    });
    return this;
  }
  
  // 多值匹配
  terms(field, values) {
    this.query.bool.filter.push({
      terms: { [field]: values },
    });
    return this;
  }
  
  // 范围查询
  range(field, gte, lte) {
    const rangeQuery = {};
    if (gte !== undefined) rangeQuery.gte = gte;
    if (lte !== undefined) rangeQuery.lte = lte;
    
    this.query.bool.filter.push({
      range: { [field]: rangeQuery },
    });
    return this;
  }
  
  // 存在检查
  exists(field) {
    this.query.bool.filter.push({
      exists: { field },
    });
    return this;
  }
  
  // 排除
  mustNot(field, value) {
    this.query.bool.must_not.push({
      term: { [field]: value },
    });
    return this;
  }
  
  // 应该匹配（至少一个）
  should(queries) {
    queries.forEach((q) => {
      this.query.bool.should.push(q);
    });
    return this;
  }
  
  // 嵌套查询
  nested(path, query) {
    this.query.bool.must.push({
      nested: {
        path,
        query,
      },
    });
    return this;
  }
  
  // 排序
  sort(field, order = 'asc') {
    this.sortArray.push({ [field]: { order } });
    return this;
  }
  
  // 分页
  from(offset) {
    this.fromValue = offset;
    return this;
  }
  
  size(limit) {
    this.sizeValue = limit;
    return this;
  }
  
  // 聚合
  aggregation(name, agg) {
    this.aggsObject[name] = agg;
    return this;
  }
  
  // 构建查询
  build() {
    const query = {
      query: this.query,
      from: this.fromValue,
      size: this.sizeValue,
    };
    
    if (this.sortArray.length > 0) {
      query.sort = this.sortArray;
    }
    
    if (Object.keys(this.aggsObject).length > 0) {
      query.aggs = this.aggsObject;
    }
    
    // 清理空的数组
    Object.keys(query.query.bool).forEach((key) => {
      if (query.query.bool[key].length === 0) {
        delete query.query.bool[key];
      }
    });
    
    return query;
  }
}

export default QueryBuilder;
```

## 最佳实践

### 1. 索引设计
- 使用合适的分片数量（通常每个分片 10-50GB）
- 为不同数据类型选择合适的字段类型
- 使用分析器优化搜索体验
- 避免过度嵌套和父子关系

### 2. 查询优化
- 使用 filter 代替 query 进行精确匹配（可缓存）
- 限制返回字段（_source filtering）
- 使用分页避免深度分页（使用 search_after）
- 合理使用聚合

### 3. 性能调优
- 批量操作代替单个操作
- 使用 refresh_interval 控制刷新频率
- 预热索引和缓存
- 监控慢查询

### 4. 数据建模
- 反规范化数据以提高查询性能
- 使用 nested 处理对象数组
- 合理设计索引生命周期

### 5. 安全性
- 启用安全功能（认证和授权）
- 使用 HTTPS 加密通信
- 实现字段级安全
- 定期备份

## 常用命令

### 集群管理

```bash
# 查看集群健康
curl -X GET "localhost:9200/_cluster/health?pretty"

# 查看节点信息
curl -X GET "localhost:9200/_nodes/stats?pretty"

# 查看索引列表
curl -X GET "localhost:9200/_cat/indices?v"

# 查看分片状态
curl -X GET "localhost:9200/_cat/shards?v"

# 查看别名
curl -X GET "localhost:9200/_aliases?pretty"

# 清除缓存
curl -X POST "localhost:9200/_cache/clear"
```

### 索引操作

```bash
# 创建索引
curl -X PUT "localhost:9200/my-index" -H 'Content-Type: application/json' -d'
{
  "settings": {
    "number_of_shards": 3,
    "number_of_replicas": 1
  }
}'

# 删除索引
curl -X DELETE "localhost:9200/my-index"

# 打开/关闭索引
curl -X POST "localhost:9200/my-index/_close"
curl -X POST "localhost:9200/my-index/_open"

# 刷新索引
curl -X POST "localhost:9200/my-index/_refresh"

# 强制合并段
curl -X POST "localhost:9200/my-index/_forcemerge?max_num_segments=1"
```

### 文档操作

```bash
# 索引文档
curl -X POST "localhost:9200/my-index/_doc/1" -H 'Content-Type: application/json' -d'
{
  "title": "My Document",
  "content": "This is a test document"
}'

# 获取文档
curl -X GET "localhost:9200/my-index/_doc/1"

# 更新文档
curl -X POST "localhost:9200/my-index/_update/1" -H 'Content-Type: application/json' -d'
{
  "doc": {
    "title": "Updated Title"
  }
}'

# 删除文档
curl -X DELETE "localhost:9200/my-index/_doc/1"

# 批量操作
curl -X POST "localhost:9200/_bulk" -H 'Content-Type: application/json' -d'
{"index": {"_index": "my-index", "_id": "1"}}
{"title": "Document 1"}
{"index": {"_index": "my-index", "_id": "2"}}
{"title": "Document 2"}
'
```

### 搜索

```bash
# 基础搜索
curl -X GET "localhost:9200/my-index/_search?q=title:test&pretty"

# DSL 搜索
curl -X GET "localhost:9200/my-index/_search" -H 'Content-Type: application/json' -d'
{
  "query": {
    "match": {
      "title": "test"
    }
  }
}'

# 分页搜索
curl -X GET "localhost:9200/my-index/_search" -H 'Content-Type: application/json' -d'
{
  "from": 0,
  "size": 10,
  "query": {
    "match_all": {}
  }
}'

# 聚合查询
curl -X GET "localhost:9200/my-index/_search" -H 'Content-Type: application/json' -d'
{
  "size": 0,
  "aggs": {
    "categories": {
      "terms": {
        "field": "category"
      }
    }
  }
}'
```

## 部署配置

### Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.11.0
    container_name: elasticsearch
    environment:
      - node.name=elasticsearch
      - cluster.name=docker-cluster
      - discovery.type=single-node
      - bootstrap.memory_lock=true
      - xpack.security.enabled=true
      - xpack.security.enrollment.enabled=false
      - "ES_JAVA_OPTS=-Xms1g -Xmx1g"
    ulimits:
      memlock:
        soft: -1
        hard: -1
    volumes:
      - es_data:/usr/share/elasticsearch/data
      - ./config/elasticsearch.yml:/usr/share/elasticsearch/config/elasticsearch.yml
    ports:
      - "9200:9200"
      - "9300:9300"
    networks:
      - elastic

  kibana:
    image: docker.elastic.co/kibana/kibana:8.11.0
    container_name: kibana
    environment:
      - ELASTICSEARCH_HOSTS=http://elasticsearch:9200
      - ELASTICSEARCH_USERNAME=kibana_system
      - ELASTICSEARCH_PASSWORD=changeme
    ports:
      - "5601:5601"
    networks:
      - elastic
    depends_on:
      - elasticsearch

  logstash:
    image: docker.elastic.co/logstash/logstash:8.11.0
    container_name: logstash
    volumes:
      - ./config/logstash.conf:/usr/share/logstash/pipeline/logstash.conf
    ports:
      - "5044:5044"
    networks:
      - elastic
    depends_on:
      - elasticsearch

volumes:
  es_data:
    driver: local

networks:
  elastic:
    driver: bridge
```

### elasticsearch.yml

```yaml
# config/elasticsearch.yml
cluster.name: my-cluster
node.name: node-1

path.data: /usr/share/elasticsearch/data
path.logs: /usr/share/elasticsearch/logs

network.host: 0.0.0.0
http.port: 9200

discovery.type: single-node

# 安全设置
xpack.security.enabled: true
xpack.security.enrollment.enabled: false

# 性能调优
indices.query.bool.max_clause_count: 4096
search.max_buckets: 100000

# 缓存设置
indices.queries.cache.size: 10%
indices.fielddata.cache.size: 40%

# 线程池
thread_pool.search.size: 10
thread_pool.search.queue_size: 1000
thread_pool.write.size: 10
thread_pool.write.queue_size: 1000
```

### 索引生命周期管理 (ILM)

```json
// 创建生命周期策略
PUT _ilm/policy/my_policy
{
  "policy": {
    "phases": {
      "hot": {
        "min_age": "0ms",
        "actions": {
          "rollover": {
            "max_size": "50gb",
            "max_age": "30d"
          },
          "set_priority": {
            "priority": 100
          }
        }
      },
      "warm": {
        "min_age": "7d",
        "actions": {
          "shrink": {
            "number_of_shards": 1
          },
          "forcemerge": {
            "max_num_segments": 1
          },
          "set_priority": {
            "priority": 50
          }
        }
      },
      "cold": {
        "min_age": "30d",
        "actions": {
          "freeze": {},
          "set_priority": {
            "priority": 0
          }
        }
      },
      "delete": {
        "min_age": "90d",
        "actions": {
          "delete": {}
        }
      }
    }
  }
}

// 应用生命周期策略到索引模板
PUT _index_template/my_template
{
  "index_patterns": ["my-index-*"],
  "template": {
    "settings": {
      "number_of_shards": 3,
      "number_of_replicas": 1,
      "index.lifecycle.name": "my_policy",
      "index.lifecycle.rollover_alias": "my-index"
    },
    "aliases": {
      "my-index": {
        "is_write_index": true
      }
    }
  }
}
```

### 监控和告警 (Prometheus + Grafana)

```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'elasticsearch'
    static_configs:
      - targets: ['elasticsearch-exporter:9114']

# docker-compose.yml 添加 exporter
elasticsearch-exporter:
  image: quay.io/prometheuscommunity/elasticsearch-exporter:latest
  container_name: es-exporter
  command:
    - '--es.uri=http://elasticsearch:9200'
    - '--es.all'
  ports:
    - "9114:9114"
  networks:
    - elastic
  depends_on:
    - elasticsearch
```

### 快照和恢复

```bash
# 创建快照仓库
curl -X PUT "localhost:9200/_snapshot/my_backup" -H 'Content-Type: application/json' -d'
{
  "type": "fs",
  "settings": {
    "location": "/mount/backups/my_backup"
  }
}'

# 创建快照
curl -X PUT "localhost:9200/_snapshot/my_backup/snapshot_1?wait_for_completion=true"

# 恢复快照
curl -X POST "localhost:9200/_snapshot/my_backup/snapshot_1/_restore"

# 查看快照状态
curl -X GET "localhost:9200/_snapshot/my_backup/snapshot_1"
```
