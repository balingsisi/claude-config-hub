# MySQL Database Template

## Project Overview

MySQL is the world's most popular open-source relational database management system. Known for its reliability, performance, and ease of use, MySQL powers many of the world's largest applications including Facebook, Twitter, YouTube, and countless web applications.

## Tech Stack

- **Database**: MySQL 8.0+
- **Driver**: mysql2 (Node.js)
- **ORM**: TypeORM / Prisma / Sequelize
- **Migrations**: Custom / ORM built-in
- **Monitoring**: Prometheus / Grafana / PMM
- **Backup**: mysqldump / Percona XtraBackup

## Project Structure

```
├── database/
│   ├── schema/
│   │   ├── 01_users.sql
│   │   ├── 02_posts.sql
│   │   ├── 03_comments.sql
│   │   ├── 04_indexes.sql
│   │   └── 05_views.sql
│   ├── migrations/
│   │   ├── 20240101000000_create_users.php
│   │   ├── 20240102000000_add_user_status.php
│   │   └── rollback.php
│   ├── seeds/
│   │   ├── users.sql
│   │   └── posts.sql
│   ├── procedures/
│   │   ├── sp_get_user_stats.sql
│   │   └── sp_cleanup_old_data.sql
│   ├── triggers/
│   │   ├── tr_update_timestamp.sql
│   │   └── tr_audit_log.sql
│   ├── views/
│   │   ├── v_active_users.sql
│   │   └── v_post_stats.sql
│   └── backup/
│       ├── full-backup.sh
│       └── incremental-backup.sh
├── config/
│   ├── my.cnf                  # MySQL config
│   └── connection.js           # Connection config
├── scripts/
│   ├── setup.sh                # Initial setup
│   ├── migrate.sh              # Run migrations
│   └── backup.sh               # Backup script
├── monitoring/
│   ├── prometheus/
│   │   └── mysql-exporter.yml
│   └── grafana/
│       └── dashboard.json
├── tests/
│   ├── performance/
│   │   └── benchmark.sql
│   └── integration/
│       └── queries.test.js
└── README.md
```

## Key Patterns

### 1. Schema Design

```sql
-- database/schema/01_users.sql

-- Users table with proper indexing and constraints
CREATE TABLE users (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    uuid CHAR(36) NOT NULL DEFAULT (UUID()),
    email VARCHAR(255) NOT NULL,
    username VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(20),
    avatar_url VARCHAR(500),
    
    -- Status and role
    status ENUM('active', 'inactive', 'suspended', 'pending') NOT NULL DEFAULT 'pending',
    role ENUM('user', 'moderator', 'admin') NOT NULL DEFAULT 'user',
    email_verified_at TIMESTAMP NULL,
    
    -- Metadata
    last_login_at TIMESTAMP NULL,
    login_count INT UNSIGNED DEFAULT 0,
    
    -- Soft delete
    deleted_at TIMESTAMP NULL,
    
    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT uk_users_email UNIQUE (email),
    CONSTRAINT uk_users_username UNIQUE (username),
    CONSTRAINT uk_users_uuid UNIQUE (uuid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Indexes
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_created_at ON users(created_at);
CREATE INDEX idx_users_email_verified ON users(email_verified_at);
CREATE INDEX idx_users_deleted_at ON users(deleted_at);

-- Full-text search on names
CREATE FULLTEXT INDEX idx_users_name_ft ON users(first_name, last_name);

-- database/schema/02_posts.sql

-- Posts table
CREATE TABLE posts (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    uuid CHAR(36) NOT NULL DEFAULT (UUID()),
    user_id BIGINT UNSIGNED NOT NULL,
    
    -- Content
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    content LONGTEXT NOT NULL,
    excerpt TEXT,
    featured_image_url VARCHAR(500),
    
    -- Status
    status ENUM('draft', 'published', 'archived', 'deleted') NOT NULL DEFAULT 'draft',
    visibility ENUM('public', 'private', 'unlisted') NOT NULL DEFAULT 'public',
    
    -- Publishing
    published_at TIMESTAMP NULL,
    
    -- SEO
    meta_title VARCHAR(255),
    meta_description TEXT,
    
    -- Stats
    view_count INT UNSIGNED DEFAULT 0,
    like_count INT UNSIGNED DEFAULT 0,
    comment_count INT UNSIGNED DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    
    -- Constraints
    CONSTRAINT uk_posts_slug UNIQUE (slug),
    CONSTRAINT uk_posts_uuid UNIQUE (uuid),
    CONSTRAINT fk_posts_user FOREIGN KEY (user_id) 
        REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Indexes
CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_status ON posts(status);
CREATE INDEX idx_posts_published_at ON posts(published_at);
CREATE INDEX idx_posts_created_at ON posts(created_at);

-- Full-text search
CREATE FULLTEXT INDEX idx_posts_content_ft ON posts(title, content);

-- Composite index for common queries
CREATE INDEX idx_posts_status_published ON posts(status, published_at);

-- database/schema/03_comments.sql

-- Comments table (nested set model for hierarchical comments)
CREATE TABLE comments (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    uuid CHAR(36) NOT NULL DEFAULT (UUID()),
    post_id BIGINT UNSIGNED NOT NULL,
    user_id BIGINT UNSIGNED NOT NULL,
    parent_id BIGINT UNSIGNED NULL,
    
    -- Content
    content TEXT NOT NULL,
    
    -- Status
    status ENUM('pending', 'approved', 'spam', 'deleted') NOT NULL DEFAULT 'pending',
    
    -- IP and user agent for spam detection
    ip_address VARCHAR(45),
    user_agent VARCHAR(500),
    
    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    
    -- Constraints
    CONSTRAINT uk_comments_uuid UNIQUE (uuid),
    CONSTRAINT fk_comments_post FOREIGN KEY (post_id) 
        REFERENCES posts(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_comments_user FOREIGN KEY (user_id) 
        REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_comments_parent FOREIGN KEY (parent_id) 
        REFERENCES comments(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Indexes
CREATE INDEX idx_comments_post_id ON comments(post_id);
CREATE INDEX idx_comments_user_id ON comments(user_id);
CREATE INDEX idx_comments_parent_id ON comments(parent_id);
CREATE INDEX idx_comments_status ON comments(status);
```

### 2. Node.js Connection

```javascript
// config/connection.js
const mysql = require('mysql2/promise');

// Connection pool configuration
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'myapp',
  
  // Connection pool settings
  waitForConnections: true,
  connectionLimit: 20,
  queueLimit: 0,
  
  // Performance settings
  connectTimeout: 10000,
  acquireTimeout: 10000,
  timeout: 60000,
  
  // Character set
  charset: 'utf8mb4',
  
  // Timezone
  timezone: '+00:00',
  
  // SSL (production)
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: true,
  } : undefined,
});

// Test connection
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('Database connected successfully');
    await connection.ping();
    connection.release();
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}

// Query helper with error handling
async function query(sql, params = []) {
  const [rows] = await pool.execute(sql, params);
  return rows;
}

// Transaction helper
async function transaction(callback) {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const result = await callback(connection);
    
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

module.exports = {
  pool,
  testConnection,
  query,
  transaction,
};
```

### 3. Repository Pattern

```javascript
// repositories/UserRepository.js
const { query, transaction } = require('../config/connection');

class UserRepository {
  async create(userData) {
    const sql = `
      INSERT INTO users (
        email, username, password_hash, first_name, 
        last_name, phone, status, role
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const params = [
      userData.email,
      userData.username,
      userData.passwordHash,
      userData.firstName,
      userData.lastName,
      userData.phone,
      userData.status || 'pending',
      userData.role || 'user',
    ];
    
    const result = await query(sql, params);
    
    return this.findById(result.insertId);
  }

  async findById(id) {
    const sql = `
      SELECT 
        id, uuid, email, username, first_name, last_name, 
        phone, avatar_url, status, role, email_verified_at,
        last_login_at, login_count, created_at, updated_at
      FROM users 
      WHERE id = ? AND deleted_at IS NULL
    `;
    
    const [user] = await query(sql, [id]);
    return user || null;
  }

  async findByUuid(uuid) {
    const sql = `
      SELECT 
        id, uuid, email, username, first_name, last_name, 
        phone, avatar_url, status, role, email_verified_at,
        last_login_at, login_count, created_at, updated_at
      FROM users 
      WHERE uuid = ? AND deleted_at IS NULL
    `;
    
    const [user] = await query(sql, [uuid]);
    return user || null;
  }

  async findByEmail(email) {
    const sql = `
      SELECT * 
      FROM users 
      WHERE email = ? AND deleted_at IS NULL
    `;
    
    const [user] = await query(sql, [email]);
    return user || null;
  }

  async findByUsername(username) {
    const sql = `
      SELECT * 
      FROM users 
      WHERE username = ? AND deleted_at IS NULL
    `;
    
    const [user] = await query(sql, [username]);
    return user || null;
  }

  async findAll(options = {}) {
    const { page = 1, limit = 20, status, search } = options;
    const offset = (page - 1) * limit;
    
    let sql = `
      SELECT 
        id, uuid, email, username, first_name, last_name, 
        status, role, created_at
      FROM users 
      WHERE deleted_at IS NULL
    `;
    
    const params = [];
    
    if (status) {
      sql += ' AND status = ?';
      params.push(status);
    }
    
    if (search) {
      sql += ' AND (email LIKE ? OR username LIKE ? OR first_name LIKE ? OR last_name LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }
    
    // Get total count
    const countSql = sql.replace(
      /SELECT.*FROM/,
      'SELECT COUNT(*) as total FROM'
    );
    const [{ total }] = await query(countSql, params);
    
    // Add pagination
    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);
    
    const data = await query(sql, params);
    
    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async update(id, updates) {
    const allowedFields = [
      'email', 'username', 'first_name', 'last_name',
      'phone', 'avatar_url', 'status', 'role',
    ];
    
    const fields = [];
    const params = [];
    
    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        fields.push(`${key} = ?`);
        params.push(value);
      }
    }
    
    if (fields.length === 0) {
      return this.findById(id);
    }
    
    params.push(id);
    
    const sql = `
      UPDATE users 
      SET ${fields.join(', ')} 
      WHERE id = ? AND deleted_at IS NULL
    `;
    
    await query(sql, params);
    
    return this.findById(id);
  }

  async softDelete(id) {
    const sql = `
      UPDATE users 
      SET deleted_at = CURRENT_TIMESTAMP 
      WHERE id = ? AND deleted_at IS NULL
    `;
    
    await query(sql, [id]);
  }

  async hardDelete(id) {
    const sql = 'DELETE FROM users WHERE id = ?';
    await query(sql, [id]);
  }

  async updateLastLogin(id) {
    const sql = `
      UPDATE users 
      SET 
        last_login_at = CURRENT_TIMESTAMP,
        login_count = login_count + 1
      WHERE id = ?
    `;
    
    await query(sql, [id]);
  }

  async verifyEmail(id) {
    const sql = `
      UPDATE users 
      SET 
        email_verified_at = CURRENT_TIMESTAMP,
        status = 'active'
      WHERE id = ?
    `;
    
    await query(sql, [id]);
  }
}

module.exports = new UserRepository();
```

### 4. Complex Queries

```javascript
// repositories/PostRepository.js
const { query } = require('../config/connection');

class PostRepository {
  async findWithAuthorAndComments(postId) {
    const sql = `
      SELECT 
        p.*,
        JSON_OBJECT(
          'id', u.id,
          'uuid', u.uuid,
          'username', u.username,
          'firstName', u.first_name,
          'lastName', u.last_name,
          'avatarUrl', u.avatar_url
        ) as author,
        (
          SELECT JSON_ARRAYAGG(
            JSON_OBJECT(
              'id', c.id,
              'content', c.content,
              'createdAt', c.created_at,
              'author', JSON_OBJECT(
                'id', cu.id,
                'username', cu.username,
                'avatarUrl', cu.avatar_url
              )
            )
          )
          FROM comments c
          JOIN users cu ON c.user_id = cu.id
          WHERE c.post_id = p.id AND c.status = 'approved' AND c.deleted_at IS NULL
          ORDER BY c.created_at DESC
          LIMIT 10
        ) as comments
      FROM posts p
      JOIN users u ON p.user_id = u.id
      WHERE p.id = ? AND p.deleted_at IS NULL
    `;
    
    const [post] = await query(sql, [postId]);
    return post || null;
  }

  async searchPosts(searchTerm, options = {}) {
    const { page = 1, limit = 20 } = options;
    const offset = (page - 1) * limit;
    
    const sql = `
      SELECT 
        p.id, p.uuid, p.title, p.slug, p.excerpt, 
        p.featured_image_url, p.view_count, p.like_count,
        p.published_at, p.created_at,
        MATCH(p.title, p.content) AGAINST(? IN BOOLEAN MODE) as relevance,
        JSON_OBJECT(
          'id', u.id,
          'username', u.username,
          'avatarUrl', u.avatar_url
        ) as author
      FROM posts p
      JOIN users u ON p.user_id = u.id
      WHERE 
        MATCH(p.title, p.content) AGAINST(? IN BOOLEAN MODE)
        AND p.status = 'published'
        AND p.visibility = 'public'
        AND p.deleted_at IS NULL
      ORDER BY relevance DESC, p.published_at DESC
      LIMIT ? OFFSET ?
    `;
    
    const data = await query(sql, [searchTerm, searchTerm, limit, offset]);
    
    // Get total count
    const countSql = `
      SELECT COUNT(*) as total
      FROM posts p
      WHERE 
        MATCH(p.title, p.content) AGAINST(? IN BOOLEAN MODE)
        AND p.status = 'published'
        AND p.deleted_at IS NULL
    `;
    
    const [{ total }] = await query(countSql, [searchTerm]);
    
    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getPostStats(authorId) {
    const sql = `
      SELECT 
        COUNT(*) as total_posts,
        SUM(CASE WHEN status = 'published' THEN 1 ELSE 0 END) as published_posts,
        SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) as draft_posts,
        SUM(view_count) as total_views,
        SUM(like_count) as total_likes,
        SUM(comment_count) as total_comments
      FROM posts
      WHERE user_id = ? AND deleted_at IS NULL
    `;
    
    const [stats] = await query(sql, [authorId]);
    return stats;
  }

  async getTrendingPosts(limit = 10) {
    const sql = `
      SELECT 
        p.id, p.uuid, p.title, p.slug, p.excerpt,
        p.view_count, p.like_count, p.comment_count,
        p.published_at,
        (
          (p.view_count * 0.3) + 
          (p.like_count * 0.5) + 
          (p.comment_count * 0.7)
        ) as trend_score,
        JSON_OBJECT(
          'id', u.id,
          'username', u.username
        ) as author
      FROM posts p
      JOIN users u ON p.user_id = u.id
      WHERE 
        p.status = 'published'
        AND p.visibility = 'public'
        AND p.deleted_at IS NULL
        AND p.published_at >= DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 7 DAY)
      ORDER BY trend_score DESC
      LIMIT ?
    `;
    
    return query(sql, [limit]);
  }

  async incrementViewCount(postId) {
    const sql = `
      UPDATE posts 
      SET view_count = view_count + 1 
      WHERE id = ?
    `;
    
    await query(sql, [postId]);
  }
}

module.exports = new PostRepository();
```

### 5. Stored Procedures

```sql
-- database/procedures/sp_get_user_stats.sql

DELIMITER //

CREATE PROCEDURE sp_get_user_stats(IN p_user_id BIGINT)
BEGIN
    DECLARE v_post_count INT;
    DECLARE v_comment_count INT;
    DECLARE v_total_views BIGINT;
    DECLARE v_total_likes BIGINT;
    
    -- Get post statistics
    SELECT 
        COUNT(*),
        COALESCE(SUM(view_count), 0),
        COALESCE(SUM(like_count), 0)
    INTO v_post_count, v_total_views, v_total_likes
    FROM posts
    WHERE user_id = p_user_id AND deleted_at IS NULL;
    
    -- Get comment count
    SELECT COUNT(*)
    INTO v_comment_count
    FROM comments
    WHERE user_id = p_user_id AND deleted_at IS NULL;
    
    -- Return result
    SELECT 
        v_post_count as post_count,
        v_comment_count as comment_count,
        v_total_views as total_views,
        v_total_likes as total_likes;
END //

DELIMITER ;

-- Usage:
-- CALL sp_get_user_stats(123);

-- database/procedures/sp_cleanup_old_data.sql

DELIMITER //

CREATE PROCEDURE sp_cleanup_old_data(IN p_days_old INT)
BEGIN
    DECLARE v_deleted_count INT DEFAULT 0;
    
    -- Delete old soft-deleted records
    DELETE FROM comments
    WHERE deleted_at IS NOT NULL 
      AND deleted_at < DATE_SUB(CURRENT_TIMESTAMP, INTERVAL p_days_old DAY);
    
    SET v_deleted_count = ROW_COUNT();
    
    DELETE FROM posts
    WHERE deleted_at IS NOT NULL 
      AND deleted_at < DATE_SUB(CURRENT_TIMESTAMP, INTERVAL p_days_old DAY);
    
    SET v_deleted_count = v_deleted_count + ROW_COUNT();
    
    DELETE FROM users
    WHERE deleted_at IS NOT NULL 
      AND deleted_at < DATE_SUB(CURRENT_TIMESTAMP, INTERVAL p_days_old DAY);
    
    SET v_deleted_count = v_deleted_count + ROW_COUNT();
    
    -- Return result
    SELECT v_deleted_count as deleted_records;
END //

DELIMITER ;

-- Usage:
-- CALL sp_cleanup_old_data(30);
```

### 6. Triggers

```sql
-- database/triggers/tr_update_timestamp.sql

DELIMITER //

CREATE TRIGGER tr_posts_before_update
BEFORE UPDATE ON posts
FOR EACH ROW
BEGIN
    -- Automatically update updated_at
    SET NEW.updated_at = CURRENT_TIMESTAMP;
    
    -- Generate slug if title changed and slug not set
    IF NEW.title <> OLD.title AND NEW.slug = OLD.slug THEN
        SET NEW.slug = LOWER(REPLACE(NEW.title, ' ', '-'));
    END IF;
END //

DELIMITER ;

-- database/triggers/tr_audit_log.sql

DELIMITER //

CREATE TABLE audit_log (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    table_name VARCHAR(50) NOT NULL,
    record_id BIGINT UNSIGNED NOT NULL,
    action ENUM('INSERT', 'UPDATE', 'DELETE') NOT NULL,
    old_values JSON,
    new_values JSON,
    user_id BIGINT UNSIGNED,
    ip_address VARCHAR(45),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_audit_table_record (table_name, record_id),
    INDEX idx_audit_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TRIGGER tr_users_after_update
AFTER UPDATE ON users
FOR EACH ROW
BEGIN
    INSERT INTO audit_log (table_name, record_id, action, old_values, new_values)
    VALUES (
        'users',
        NEW.id,
        'UPDATE',
        JSON_OBJECT(
            'email', OLD.email,
            'status', OLD.status,
            'role', OLD.role
        ),
        JSON_OBJECT(
            'email', NEW.email,
            'status', NEW.status,
            'role', NEW.role
        )
    );
END //

DELIMITER ;
```

### 7. Views

```sql
-- database/views/v_active_users.sql

CREATE OR REPLACE VIEW v_active_users AS
SELECT 
    u.id,
    u.uuid,
    u.email,
    u.username,
    u.first_name,
    u.last_name,
    u.avatar_url,
    u.created_at,
    COUNT(DISTINCT p.id) as post_count,
    COUNT(DISTINCT c.id) as comment_count,
    COALESCE(SUM(p.view_count), 0) as total_views
FROM users u
LEFT JOIN posts p ON u.id = p.user_id AND p.deleted_at IS NULL
LEFT JOIN comments c ON u.id = c.user_id AND c.deleted_at IS NULL
WHERE 
    u.status = 'active'
    AND u.deleted_at IS NULL
    AND u.last_login_at >= DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 30 DAY)
GROUP BY u.id
ORDER BY post_count DESC, total_views DESC;

-- Usage:
-- SELECT * FROM v_active_users LIMIT 20;

-- database/views/v_post_stats.sql

CREATE OR REPLACE VIEW v_post_stats AS
SELECT 
    DATE(published_at) as publish_date,
    COUNT(*) as posts_published,
    SUM(view_count) as total_views,
    SUM(like_count) as total_likes,
    SUM(comment_count) as total_comments,
    AVG(view_count) as avg_views,
    AVG(like_count) as avg_likes
FROM posts
WHERE 
    status = 'published'
    AND deleted_at IS NULL
    AND published_at >= DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 30 DAY)
GROUP BY DATE(published_at)
ORDER BY publish_date DESC;

-- Usage:
-- SELECT * FROM v_post_stats;
```

### 8. Backup Scripts

```bash
#!/bin/bash
# database/backup/full-backup.sh

# Configuration
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-3306}"
DB_USER="${DB_USER:-root}"
DB_PASS="${DB_PASSWORD}"
DB_NAME="${DB_NAME:-myapp}"

BACKUP_DIR="/var/backups/mysql"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/${DB_NAME}_${DATE}.sql.gz"

# Create backup directory
mkdir -p "${BACKUP_DIR}"

# Full backup with mysqldump
mysqldump \
  --host="${DB_HOST}" \
  --port="${DB_PORT}" \
  --user="${DB_USER}" \
  --password="${DB_PASS}" \
  --single-transaction \
  --routines \
  --triggers \
  --events \
  --hex-blob \
  --quick \
  --compress \
  "${DB_NAME}" | gzip > "${BACKUP_FILE}"

# Check if backup was successful
if [ $? -eq 0 ]; then
    echo "Backup created successfully: ${BACKUP_FILE}"
    
    # Calculate checksum
    sha256sum "${BACKUP_FILE}" > "${BACKUP_FILE}.sha256"
    
    # Delete old backups (keep last 7 days)
    find "${BACKUP_DIR}" -name "${DB_NAME}_*.sql.gz" -type f -mtime +7 -delete
    
    # Upload to S3 (optional)
    # aws s3 cp "${BACKUP_FILE}" s3://my-backups/mysql/
else
    echo "Backup failed!"
    exit 1
fi

#!/bin/bash
# database/backup/incremental-backup.sh

# Configuration
BACKUP_DIR="/var/backups/mysql/binlog"
MYSQL_DATA_DIR="/var/lib/mysql"

# Create backup directory
mkdir -p "${BACKUP_DIR}"

# Flush logs and copy binary logs
mysql -e "FLUSH LOGS;"

# Copy new binary logs
for log in $(mysql -N -e "SHOW BINARY LOGS;" | awk '{print $1}'); do
    if [ ! -f "${BACKUP_DIR}/${log}" ]; then
        cp "${MYSQL_DATA_DIR}/${log}" "${BACKUP_DIR}/"
        echo "Copied binary log: ${log}"
    fi
done

echo "Incremental backup completed at $(date)"
```

## Best Practices

### 1. Schema Design
- Use appropriate data types
- Add indexes for frequently queried columns
- Implement foreign key constraints
- Use ENUM for fixed value sets
- Consider partitioning for large tables

### 2. Query Optimization
- Use EXPLAIN to analyze queries
- Avoid SELECT *
- Use covering indexes
- Implement pagination
- Use prepared statements

### 3. Performance
- Enable query cache (MySQL 5.7)
- Use connection pooling
- Implement read replicas
- Monitor slow queries
- Optimize JOIN operations

### 4. Security
- Use parameterized queries
- Implement row-level security
- Encrypt sensitive data
- Use SSL connections
- Regular security audits

## Common Commands

```bash
# Connection
mysql -u root -p                    # Connect to MySQL
mysql -h host -u user -p database   # Connect to specific database

# Database management
CREATE DATABASE myapp;              # Create database
DROP DATABASE myapp;                # Drop database
SHOW DATABASES;                     # List databases
USE myapp;                          # Select database

# Table management
SHOW TABLES;                        # List tables
DESCRIBE users;                     # Show table structure
SHOW CREATE TABLE users;            # Show create statement

# User management
CREATE USER 'user'@'localhost' IDENTIFIED BY 'password';
GRANT ALL PRIVILEGES ON myapp.* TO 'user'@'localhost';
FLUSH PRIVILEGES;

# Backup and restore
mysqldump -u root -p myapp > backup.sql
mysql -u root -p myapp < backup.sql

# Performance
EXPLAIN SELECT * FROM users WHERE email = 'test@example.com';
SHOW PROFILE;
SHOW STATUS LIKE 'Slow_queries';

# Monitoring
SHOW PROCESSLIST;                   # Show active queries
SHOW ENGINE INNODB STATUS;          # InnoDB status
SHOW GLOBAL STATUS;                 # Global status variables
SHOW GLOBAL VARIABLES;              # Global configuration
```

## Configuration

```ini
# config/my.cnf

[mysqld]
# Basic settings
user = mysql
port = 3306
bind-address = 0.0.0.0
datadir = /var/lib/mysql
socket = /var/run/mysqld/mysqld.sock

# Character set
character-set-server = utf8mb4
collation-server = utf8mb4_unicode_ci

# Connection settings
max_connections = 200
max_connect_errors = 100
connect_timeout = 10
wait_timeout = 28800
interactive_timeout = 28800

# Buffer settings
innodb_buffer_pool_size = 1G
innodb_buffer_pool_instances = 4
innodb_log_buffer_size = 16M

# Log settings
log_error = /var/log/mysql/error.log
slow_query_log = 1
slow_query_log_file = /var/log/mysql/slow.log
long_query_time = 2
log_queries_not_using_indexes = 1

# InnoDB settings
innodb_flush_log_at_trx_commit = 1
innodb_lock_wait_timeout = 50
innodb_file_per_table = 1

# Binary logging (for replication)
log_bin = mysql-bin
binlog_format = ROW
expire_logs_days = 7
max_binlog_size = 100M

# Query cache (MySQL 5.7)
query_cache_type = 1
query_cache_size = 64M

# SSL
ssl-ca = /etc/mysql/ssl/ca.pem
ssl-cert = /etc/mysql/ssl/server-cert.pem
ssl-key = /etc/mysql/ssl/server-key.pem

[client]
port = 3306
socket = /var/run/mysqld/mysqld.sock
default-character-set = utf8mb4
```

## Deployment

### Docker

```dockerfile
FROM mysql:8.0

# Custom configuration
COPY config/my.cnf /etc/mysql/conf.d/

# Initialization scripts
COPY database/schema/ /docker-entrypoint-initdb.d/

# Environment variables
ENV MYSQL_ROOT_PASSWORD=root_password
ENV MYSQL_DATABASE=myapp
ENV MYSQL_USER=app_user
ENV MYSQL_PASSWORD=app_password

# Expose port
EXPOSE 3306

# Health check
HEALTHCHECK --interval=10s --timeout=5s --start-period=30s --retries=3 \
    CMD mysqladmin ping -h localhost -u root -p$MYSQL_ROOT_PASSWORD || exit 1
```

### Docker Compose

```yaml
version: '3.8'

services:
  mysql:
    image: mysql:8.0
    container_name: mysql
    restart: unless-stopped
    environment:
      MYSQL_ROOT_PASSWORD: root_password
      MYSQL_DATABASE: myapp
      MYSQL_USER: app_user
      MYSQL_PASSWORD: app_password
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql
      - ./config/my.cnf:/etc/mysql/conf.d/my.cnf:ro
      - ./database/schema:/docker-entrypoint-initdb.d:ro
    command:
      - --character-set-server=utf8mb4
      - --collation-server=utf8mb4_unicode_ci
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      interval: 10s
      timeout: 5s
      retries: 5

  # MySQL Exporter for Prometheus
  mysql-exporter:
    image: prom/mysqld-exporter:latest
    container_name: mysql-exporter
    restart: unless-stopped
    environment:
      DATA_SOURCE_NAME: "app_user:app_password@(mysql:3306)/myapp"
    ports:
      - "9104:9104"
    depends_on:
      - mysql

volumes:
  mysql_data:
```

### Kubernetes

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: mysql-pvc
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 10Gi
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: mysql
spec:
  replicas: 1
  selector:
    matchLabels:
      app: mysql
  template:
    metadata:
      labels:
        app: mysql
    spec:
      containers:
      - name: mysql
        image: mysql:8.0
        env:
        - name: MYSQL_ROOT_PASSWORD
          valueFrom:
            secretKeyRef:
              name: mysql-secret
              key: root-password
        - name: MYSQL_DATABASE
          value: myapp
        - name: MYSQL_USER
          valueFrom:
            secretKeyRef:
              name: mysql-secret
              key: username
        - name: MYSQL_PASSWORD
          valueFrom:
            secretKeyRef:
              name: mysql-secret
              key: password
        ports:
        - containerPort: 3306
        volumeMounts:
        - name: mysql-storage
          mountPath: /var/lib/mysql
      volumes:
      - name: mysql-storage
        persistentVolumeClaim:
          claimName: mysql-pvc
---
apiVersion: v1
kind: Service
metadata:
  name: mysql
spec:
  selector:
    app: mysql
  ports:
  - port: 3306
    targetPort: 3306
```

## Monitoring

```yaml
# monitoring/prometheus/mysql-exporter.yml
scrape_configs:
  - job_name: 'mysql'
    static_configs:
      - targets: ['mysql-exporter:9104']
```

## Resources

- [MySQL Documentation](https://dev.mysql.com/doc/)
- [MySQL Reference Manual](https://dev.mysql.com/doc/refman/8.0/en/)
- [MySQL Performance Blog](https://www.percona.com/blog/)
- [MySQL High Availability](https://dev.mysql.com/doc/mysql-ha-scalability/en/)

---

**Last Updated**: 2026-03-17
