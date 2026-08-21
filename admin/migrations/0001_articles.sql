CREATE TABLE IF NOT EXISTS articles (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  published_at TEXT NOT NULL,
  tags TEXT NOT NULL DEFAULT '[]',
  content TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO articles (id, title, published_at, tags, content) VALUES
  ('deposit-rate', '存款利率跌到1%，年收入100万的家庭该怎么配置资产？', '2026-06-30', '["资产配置","利率下行"]', ''),
  ('large-policy', '大额保单怎么传给子女不用交税？路径拆解', '2026-06-26', '["传承","大额保单"]', ''),
  ('service-process', '保险方案定制，我的6步标准流程', '2026-06-23', '["服务流程","方案定制"]', ''),
  ('personal-story', '从业10年，一个保险经纪人的真实自述', '2026-06-18', '["个人故事","从业经历"]', '');
