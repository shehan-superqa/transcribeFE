# Category Analytics SQL Implementation Guide

## Overview
This document outlines the implementation of accurate, SQL-based category analytics that are stored in a dedicated PostgreSQL table and incrementally updated as new transactions are processed.

## Problem Statement
Current category analytics are calculated on-the-fly using MongoDB aggregations, which can be:
- Inaccurate due to real-time calculation issues
- Slow for large datasets
- Not optimized for frequent queries

## Solution
Implement a PostgreSQL-based analytics system with:
1. **Dedicated analytics table** storing pre-calculated metrics
2. **SQL-based calculations** for accuracy
3. **Incremental updates** via database triggers/functions
4. **Real-time synchronization** as transactions are created/updated/deleted

---

## Database Schema

### 1. Category Analytics Table

```sql
CREATE TABLE category_analytics (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    category_id UUID NOT NULL,
    
    -- Time period identifiers
    period_type VARCHAR(20) NOT NULL CHECK (period_type IN ('hour', 'day', 'week', 'month', 'year', 'all_time')),
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,
    
    -- Analytics metrics
    total_spent NUMERIC(15, 2) DEFAULT 0 NOT NULL,
    transaction_count INTEGER DEFAULT 0 NOT NULL,
    avg_transaction_amount NUMERIC(15, 2) DEFAULT 0 NOT NULL,
    
    -- Trend calculations (compared to previous period)
    previous_period_total NUMERIC(15, 2) DEFAULT 0,
    trend_percentage NUMERIC(10, 4) DEFAULT 0,
    trend_direction VARCHAR(10) CHECK (trend_direction IN ('up', 'down', 'stable')),
    
    -- Additional metrics
    min_transaction_amount NUMERIC(15, 2),
    max_transaction_amount NUMERIC(15, 2),
    median_transaction_amount NUMERIC(15, 2),
    
    -- Metadata
    last_calculated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    last_transaction_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- Constraints
    UNIQUE(user_id, category_id, period_type, period_start),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX idx_category_analytics_user_category ON category_analytics(user_id, category_id);
CREATE INDEX idx_category_analytics_period ON category_analytics(period_type, period_start, period_end);
CREATE INDEX idx_category_analytics_updated ON category_analytics(updated_at);

-- Enable RLS if using Supabase
ALTER TABLE category_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own category analytics"
    ON category_analytics FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);
```

### 2. Category Analytics Summary Table (Aggregated View)

For quick access to current period analytics:

```sql
CREATE TABLE category_analytics_summary (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    category_id UUID NOT NULL,
    
    -- Current period (last 30 days)
    current_period_total NUMERIC(15, 2) DEFAULT 0 NOT NULL,
    current_period_count INTEGER DEFAULT 0 NOT NULL,
    current_period_avg NUMERIC(15, 2) DEFAULT 0 NOT NULL,
    
    -- Previous period (30 days before that)
    previous_period_total NUMERIC(15, 2) DEFAULT 0,
    previous_period_count INTEGER DEFAULT 0,
    previous_period_avg NUMERIC(15, 2) DEFAULT 0,
    
    -- Trend calculations
    trend_percentage NUMERIC(10, 4) DEFAULT 0,
    trend_direction VARCHAR(10) CHECK (trend_direction IN ('up', 'down', 'stable')),
    
    -- All-time totals
    all_time_total NUMERIC(15, 2) DEFAULT 0 NOT NULL,
    all_time_count INTEGER DEFAULT 0 NOT NULL,
    all_time_avg NUMERIC(15, 2) DEFAULT 0 NOT NULL,
    
    -- Metadata
    last_updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- Constraints
    UNIQUE(user_id, category_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);

CREATE INDEX idx_category_summary_user_category ON category_analytics_summary(user_id, category_id);
```

---

## SQL Functions for Analytics Calculation

### 1. Function to Calculate Period Boundaries

```sql
CREATE OR REPLACE FUNCTION get_period_boundaries(
    p_period_type VARCHAR,
    p_date TIMESTAMPTZ DEFAULT NOW()
)
RETURNS TABLE (
    period_start TIMESTAMPTZ,
    period_end TIMESTAMPTZ,
    previous_period_start TIMESTAMPTZ,
    previous_period_end TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        CASE p_period_type
            WHEN 'hour' THEN date_trunc('hour', p_date)
            WHEN 'day' THEN date_trunc('day', p_date)
            WHEN 'week' THEN date_trunc('week', p_date)
            WHEN 'month' THEN date_trunc('month', p_date)
            WHEN 'year' THEN date_trunc('year', p_date)
            ELSE date_trunc('month', p_date)
        END AS period_start,
        CASE p_period_type
            WHEN 'hour' THEN date_trunc('hour', p_date) + INTERVAL '1 hour'
            WHEN 'day' THEN date_trunc('day', p_date) + INTERVAL '1 day'
            WHEN 'week' THEN date_trunc('week', p_date) + INTERVAL '1 week'
            WHEN 'month' THEN date_trunc('month', p_date) + INTERVAL '1 month'
            WHEN 'year' THEN date_trunc('year', p_date) + INTERVAL '1 year'
            ELSE date_trunc('month', p_date) + INTERVAL '1 month'
        END AS period_end,
        CASE p_period_type
            WHEN 'hour' THEN date_trunc('hour', p_date) - INTERVAL '1 hour'
            WHEN 'day' THEN date_trunc('day', p_date) - INTERVAL '1 day'
            WHEN 'week' THEN date_trunc('week', p_date) - INTERVAL '1 week'
            WHEN 'month' THEN date_trunc('month', p_date) - INTERVAL '1 month'
            WHEN 'year' THEN date_trunc('year', p_date) - INTERVAL '1 year'
            ELSE date_trunc('month', p_date) - INTERVAL '1 month'
        END AS previous_period_start,
        CASE p_period_type
            WHEN 'hour' THEN date_trunc('hour', p_date)
            WHEN 'day' THEN date_trunc('day', p_date)
            WHEN 'week' THEN date_trunc('week', p_date)
            WHEN 'month' THEN date_trunc('month', p_date)
            WHEN 'year' THEN date_trunc('year', p_date)
            ELSE date_trunc('month', p_date)
        END AS previous_period_end;
END;
$$ LANGUAGE plpgsql;
```

### 2. Function to Calculate Category Analytics

```sql
CREATE OR REPLACE FUNCTION calculate_category_analytics(
    p_user_id UUID,
    p_category_id UUID,
    p_period_type VARCHAR DEFAULT 'month',
    p_date TIMESTAMPTZ DEFAULT NOW()
)
RETURNS VOID AS $$
DECLARE
    v_period_boundaries RECORD;
    v_current_stats RECORD;
    v_previous_stats RECORD;
    v_trend_percentage NUMERIC(10, 4);
    v_trend_direction VARCHAR(10);
BEGIN
    -- Get period boundaries
    SELECT * INTO v_period_boundaries
    FROM get_period_boundaries(p_period_type, p_date);
    
    -- Calculate current period stats
    SELECT 
        COALESCE(SUM(amount), 0) AS total_spent,
        COUNT(*) AS transaction_count,
        COALESCE(AVG(amount), 0) AS avg_amount,
        COALESCE(MIN(amount), 0) AS min_amount,
        COALESCE(MAX(amount), 0) AS max_amount,
        COALESCE(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY amount), 0) AS median_amount
    INTO v_current_stats
    FROM transactions
    WHERE user_id = p_user_id
        AND category_id = p_category_id
        AND status = 'confirmed'
        AND date >= v_period_boundaries.period_start
        AND date < v_period_boundaries.period_end;
    
    -- Calculate previous period stats
    SELECT 
        COALESCE(SUM(amount), 0) AS total_spent,
        COUNT(*) AS transaction_count,
        COALESCE(AVG(amount), 0) AS avg_amount
    INTO v_previous_stats
    FROM transactions
    WHERE user_id = p_user_id
        AND category_id = p_category_id
        AND status = 'confirmed'
        AND date >= v_period_boundaries.previous_period_start
        AND date < v_period_boundaries.previous_period_end;
    
    -- Calculate trend
    IF v_previous_stats.total_spent > 0 THEN
        v_trend_percentage := ((v_current_stats.total_spent - v_previous_stats.total_spent) / v_previous_stats.total_spent) * 100;
    ELSE
        v_trend_percentage := 0;
    END IF;
    
    -- Determine trend direction
    IF v_trend_percentage > 5 THEN
        v_trend_direction := 'up';
    ELSIF v_trend_percentage < -5 THEN
        v_trend_direction := 'down';
    ELSE
        v_trend_direction := 'stable';
    END IF;
    
    -- Insert or update analytics record
    INSERT INTO category_analytics (
        user_id,
        category_id,
        period_type,
        period_start,
        period_end,
        total_spent,
        transaction_count,
        avg_transaction_amount,
        previous_period_total,
        trend_percentage,
        trend_direction,
        min_transaction_amount,
        max_transaction_amount,
        median_transaction_amount,
        last_calculated_at,
        updated_at
    ) VALUES (
        p_user_id,
        p_category_id,
        p_period_type,
        v_period_boundaries.period_start,
        v_period_boundaries.period_end,
        v_current_stats.total_spent,
        v_current_stats.transaction_count,
        v_current_stats.avg_amount,
        v_previous_stats.total_spent,
        v_trend_percentage,
        v_trend_direction,
        v_current_stats.min_amount,
        v_current_stats.max_amount,
        v_current_stats.median_amount,
        NOW(),
        NOW()
    )
    ON CONFLICT (user_id, category_id, period_type, period_start)
    DO UPDATE SET
        total_spent = EXCLUDED.total_spent,
        transaction_count = EXCLUDED.transaction_count,
        avg_transaction_amount = EXCLUDED.avg_transaction_amount,
        previous_period_total = EXCLUDED.previous_period_total,
        trend_percentage = EXCLUDED.trend_percentage,
        trend_direction = EXCLUDED.trend_direction,
        min_transaction_amount = EXCLUDED.min_transaction_amount,
        max_transaction_amount = EXCLUDED.max_transaction_amount,
        median_transaction_amount = EXCLUDED.median_transaction_amount,
        last_calculated_at = NOW(),
        updated_at = NOW();
    
    -- Update summary table
    PERFORM update_category_analytics_summary(p_user_id, p_category_id);
END;
$$ LANGUAGE plpgsql;
```

### 3. Function to Update Summary Table

```sql
CREATE OR REPLACE FUNCTION update_category_analytics_summary(
    p_user_id UUID,
    p_category_id UUID
)
RETURNS VOID AS $$
DECLARE
    v_current_period_start TIMESTAMPTZ;
    v_current_period_end TIMESTAMPTZ;
    v_previous_period_start TIMESTAMPTZ;
    v_previous_period_end TIMESTAMPTZ;
    v_current_stats RECORD;
    v_previous_stats RECORD;
    v_all_time_stats RECORD;
    v_trend_percentage NUMERIC(10, 4);
    v_trend_direction VARCHAR(10);
BEGIN
    -- Calculate period boundaries (last 30 days)
    v_current_period_end := NOW();
    v_current_period_start := v_current_period_end - INTERVAL '30 days';
    v_previous_period_end := v_current_period_start;
    v_previous_period_start := v_previous_period_end - INTERVAL '30 days';
    
    -- Current period stats
    SELECT 
        COALESCE(SUM(amount), 0) AS total_spent,
        COUNT(*) AS transaction_count,
        COALESCE(AVG(amount), 0) AS avg_amount
    INTO v_current_stats
    FROM transactions
    WHERE user_id = p_user_id
        AND category_id = p_category_id
        AND status = 'confirmed'
        AND date >= v_current_period_start
        AND date < v_current_period_end;
    
    -- Previous period stats
    SELECT 
        COALESCE(SUM(amount), 0) AS total_spent,
        COUNT(*) AS transaction_count,
        COALESCE(AVG(amount), 0) AS avg_amount
    INTO v_previous_stats
    FROM transactions
    WHERE user_id = p_user_id
        AND category_id = p_category_id
        AND status = 'confirmed'
        AND date >= v_previous_period_start
        AND date < v_previous_period_end;
    
    -- All-time stats
    SELECT 
        COALESCE(SUM(amount), 0) AS total_spent,
        COUNT(*) AS transaction_count,
        COALESCE(AVG(amount), 0) AS avg_amount
    INTO v_all_time_stats
    FROM transactions
    WHERE user_id = p_user_id
        AND category_id = p_category_id
        AND status = 'confirmed';
    
    -- Calculate trend
    IF v_previous_stats.total_spent > 0 THEN
        v_trend_percentage := ((v_current_stats.total_spent - v_previous_stats.total_spent) / v_previous_stats.total_spent) * 100;
    ELSE
        v_trend_percentage := 0;
    END IF;
    
    -- Determine trend direction
    IF v_trend_percentage > 5 THEN
        v_trend_direction := 'up';
    ELSIF v_trend_percentage < -5 THEN
        v_trend_direction := 'down';
    ELSE
        v_trend_direction := 'stable';
    END IF;
    
    -- Insert or update summary
    INSERT INTO category_analytics_summary (
        user_id,
        category_id,
        current_period_total,
        current_period_count,
        current_period_avg,
        previous_period_total,
        previous_period_count,
        previous_period_avg,
        trend_percentage,
        trend_direction,
        all_time_total,
        all_time_count,
        all_time_avg,
        last_updated_at,
        updated_at
    ) VALUES (
        p_user_id,
        p_category_id,
        v_current_stats.total_spent,
        v_current_stats.transaction_count,
        v_current_stats.avg_amount,
        v_previous_stats.total_spent,
        v_previous_stats.transaction_count,
        v_previous_stats.avg_amount,
        v_trend_percentage,
        v_trend_direction,
        v_all_time_stats.total_spent,
        v_all_time_stats.transaction_count,
        v_all_time_stats.avg_amount,
        NOW(),
        NOW()
    )
    ON CONFLICT (user_id, category_id)
    DO UPDATE SET
        current_period_total = EXCLUDED.current_period_total,
        current_period_count = EXCLUDED.current_period_count,
        current_period_avg = EXCLUDED.current_period_avg,
        previous_period_total = EXCLUDED.previous_period_total,
        previous_period_count = EXCLUDED.previous_period_count,
        previous_period_avg = EXCLUDED.previous_period_avg,
        trend_percentage = EXCLUDED.trend_percentage,
        trend_direction = EXCLUDED.trend_direction,
        all_time_total = EXCLUDED.all_time_total,
        all_time_count = EXCLUDED.all_time_count,
        all_time_avg = EXCLUDED.all_time_avg,
        last_updated_at = NOW(),
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;
```

---

## Incremental Update Triggers

### Trigger Function for Transaction Insert/Update/Delete

```sql
CREATE OR REPLACE FUNCTION trigger_update_category_analytics()
RETURNS TRIGGER AS $$
DECLARE
    v_category_id UUID;
    v_user_id UUID;
    v_transaction_date TIMESTAMPTZ;
    v_status VARCHAR(20);
BEGIN
    -- Determine if this is INSERT, UPDATE, or DELETE
    IF TG_OP = 'DELETE' THEN
        v_category_id := OLD.category_id;
        v_user_id := OLD.user_id;
        v_transaction_date := OLD.date;
        v_status := OLD.status;
    ELSE
        v_category_id := NEW.category_id;
        v_user_id := NEW.user_id;
        v_transaction_date := NEW.date;
        v_status := NEW.status;
    END IF;
    
    -- Only process confirmed transactions
    IF v_status = 'confirmed' THEN
        -- Update analytics for multiple periods
        PERFORM calculate_category_analytics(v_user_id, v_category_id, 'hour', v_transaction_date);
        PERFORM calculate_category_analytics(v_user_id, v_category_id, 'day', v_transaction_date);
        PERFORM calculate_category_analytics(v_user_id, v_category_id, 'week', v_transaction_date);
        PERFORM calculate_category_analytics(v_user_id, v_category_id, 'month', v_transaction_date);
        PERFORM calculate_category_analytics(v_user_id, v_category_id, 'year', v_transaction_date);
        
        -- Update summary
        PERFORM update_category_analytics_summary(v_user_id, v_category_id);
    END IF;
    
    -- If category changed, update old category too
    IF TG_OP = 'UPDATE' AND OLD.category_id IS DISTINCT FROM NEW.category_id AND OLD.status = 'confirmed' THEN
        PERFORM calculate_category_analytics(OLD.user_id, OLD.category_id, 'hour', OLD.date);
        PERFORM calculate_category_analytics(OLD.user_id, OLD.category_id, 'day', OLD.date);
        PERFORM calculate_category_analytics(OLD.user_id, OLD.category_id, 'week', OLD.date);
        PERFORM calculate_category_analytics(OLD.user_id, OLD.category_id, 'month', OLD.date);
        PERFORM calculate_category_analytics(OLD.user_id, OLD.category_id, 'year', OLD.date);
        PERFORM update_category_analytics_summary(OLD.user_id, OLD.category_id);
    END IF;
    
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER update_category_analytics_on_transaction_insert
    AFTER INSERT ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_category_analytics();

CREATE TRIGGER update_category_analytics_on_transaction_update
    AFTER UPDATE ON transactions
    FOR EACH ROW
    WHEN (OLD.category_id IS DISTINCT FROM NEW.category_id 
          OR OLD.amount IS DISTINCT FROM NEW.amount 
          OR OLD.status IS DISTINCT FROM NEW.status
          OR OLD.date IS DISTINCT FROM NEW.date)
    EXECUTE FUNCTION trigger_update_category_analytics();

CREATE TRIGGER update_category_analytics_on_transaction_delete
    AFTER DELETE ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_category_analytics();
```

---

## API Endpoint Modifications

### Updated GET `/api/financial/categories/:id/analytics`

Instead of calculating on-the-fly, query the pre-calculated analytics:

```python
@category_routes.route('/categories/<category_id>/analytics', methods=['GET'])
@require_auth
def get_category_analytics(category_id):
    user_id = get_current_user_id()
    period = request.args.get('period', 'month')
    date_from = request.args.get('date_from')
    date_to = request.args.get('date_to')
    
    # Query from summary table for quick access
    query = """
        SELECT 
            current_period_total as total_spent,
            current_period_count as transaction_count,
            current_period_avg as avg_transaction_amount,
            trend_percentage,
            trend_direction as trend,
            c.category_name
        FROM category_analytics_summary cas
        JOIN categories c ON c.id = cas.category_id
        WHERE cas.user_id = %s AND cas.category_id = %s
    """
    
    result = db.execute_query(query, (user_id, category_id))
    
    if result:
        return jsonify({
            'success': True,
            'analytics': {
                'total_spent': float(result['total_spent']),
                'transaction_count': result['transaction_count'],
                'avg_transaction_amount': float(result['avg_transaction_amount']),
                'trend': result['trend'],
                'trend_percentage': float(result['trend_percentage']),
                'category_name': result['category_name']
            }
        })
    else:
        # Fallback: calculate on-demand if no summary exists
        # This should rarely happen, but ensures backward compatibility
        return calculate_and_return_analytics(user_id, category_id, period)
```

### Updated GET `/api/financial/categories/:id/trends`

Query from the analytics table:

```python
@category_routes.route('/categories/<category_id>/trends', methods=['GET'])
@require_auth
def get_category_trends(category_id):
    user_id = get_current_user_id()
    period = request.args.get('period', 'month')
    months_back = int(request.args.get('months_back', 12))
    
    # Calculate date range
    end_date = datetime.now()
    start_date = end_date - timedelta(days=months_back * 30)
    
    query = """
        SELECT 
            period_start,
            total_spent as amount,
            period_type
        FROM category_analytics
        WHERE user_id = %s 
            AND category_id = %s
            AND period_type = %s
            AND period_start >= %s
            AND period_start < %s
        ORDER BY period_start ASC
    """
    
    results = db.execute_query_all(query, (user_id, category_id, period, start_date, end_date))
    
    # Format for frontend
    trends = []
    for row in results:
        # Format label based on period type
        if period == 'hour':
            label = row['period_start'].strftime('%H:00')
        elif period == 'day':
            label = row['period_start'].strftime('%a')
        elif period == 'week':
            label = f"Week {row['period_start'].strftime('%U')}"
        elif period == 'month':
            label = row['period_start'].strftime('%b')
        elif period == 'year':
            label = row['period_start'].strftime('%Y')
        else:
            label = row['period_start'].isoformat()
        
        trends.append({
            'label': label,
            'amount': float(row['amount']),
            'period': row['period_type']
        })
    
    return jsonify({
        'success': True,
        'trends': trends
    })
```

---

## Initial Data Migration

For existing data, run a one-time migration:

```sql
-- Migration script to populate analytics for all existing transactions
DO $$
DECLARE
    rec RECORD;
BEGIN
    -- Process each user-category combination
    FOR rec IN 
        SELECT DISTINCT user_id, category_id 
        FROM transactions 
        WHERE status = 'confirmed'
    LOOP
        -- Calculate for all periods
        PERFORM calculate_category_analytics(rec.user_id, rec.category_id, 'hour');
        PERFORM calculate_category_analytics(rec.user_id, rec.category_id, 'day');
        PERFORM calculate_category_analytics(rec.user_id, rec.category_id, 'week');
        PERFORM calculate_category_analytics(rec.user_id, rec.category_id, 'month');
        PERFORM calculate_category_analytics(rec.user_id, rec.category_id, 'year');
        
        -- Update summary
        PERFORM update_category_analytics_summary(rec.user_id, rec.category_id);
    END LOOP;
END $$;
```

---

## Performance Considerations

1. **Indexes**: Ensure proper indexes on `transactions` table:
   ```sql
   CREATE INDEX idx_transactions_user_category_date ON transactions(user_id, category_id, date);
   CREATE INDEX idx_transactions_status ON transactions(status);
   ```

2. **Batch Updates**: For bulk operations, consider disabling triggers temporarily:
   ```sql
   ALTER TABLE transactions DISABLE TRIGGER update_category_analytics_on_transaction_insert;
   -- ... bulk operations ...
   ALTER TABLE transactions ENABLE TRIGGER update_category_analytics_on_transaction_insert;
   -- Then recalculate affected categories
   ```

3. **Caching**: The summary table acts as a cache for the most common queries (current period analytics).

4. **Background Jobs**: For very high-volume systems, consider moving analytics updates to a background job queue instead of triggers.

---

## Testing Checklist

- [ ] Verify analytics are calculated correctly for new transactions
- [ ] Verify analytics update when transaction is modified
- [ ] Verify analytics update when transaction is deleted
- [ ] Verify analytics update when transaction category is changed
- [ ] Verify trend calculations are accurate
- [ ] Verify performance with large datasets
- [ ] Verify concurrent transaction handling
- [ ] Run migration script on test data
- [ ] Compare SQL results with MongoDB aggregation results (for validation)

---

## Rollout Plan

1. **Phase 1**: Create tables and functions (no triggers yet)
2. **Phase 2**: Run migration script to populate initial data
3. **Phase 3**: Update API endpoints to use SQL tables
4. **Phase 4**: Enable triggers for incremental updates
5. **Phase 5**: Monitor and optimize performance
6. **Phase 6**: Remove old MongoDB aggregation code

---

## Notes

- All monetary values use `NUMERIC(15, 2)` for precision
- Timestamps use `TIMESTAMPTZ` for timezone awareness
- Trend threshold is set to 5% (configurable)
- Only `confirmed` transactions are included in analytics
- The system automatically handles time period boundaries
