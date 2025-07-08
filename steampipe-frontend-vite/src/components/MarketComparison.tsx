import React, { useState, useEffect } from 'react';
import { Card, Button, Input, Table, Tag, Spin, Alert, Tabs, Typography, Space, Divider } from 'antd';
import { SearchOutlined, SyncOutlined, DollarOutlined, BarChartOutlined } from '@ant-design/icons';
import axios from 'axios';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

interface ComparisonResult {
  success: boolean;
  itemName: string;
  buffName: string;
  timestamp: string;
  prices: {
    buff: {
      CNY: number;
      USD: number;
    };
    steam: {
      CNY: number;
      USD: number;
    };
  };
  comparison: {
    difference: {
      CNY: number;
      USD: number;
    };
    ratio: number;
    discountPercent: number;
    isCheaperOnBuff: boolean;
  };
  arbitrageScore: number;
}

interface ArbitrageOpportunity extends ComparisonResult {
  // Additional fields specific to arbitrage opportunities
}

const MarketComparison: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [comparisonResult, setComparisonResult] = useState<ComparisonResult | null>(null);
  const [arbitrageItems, setArbitrageItems] = useState<ArbitrageOpportunity[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('1');

  // Predefined popular items for quick search
  const popularItems = [
    'AK-47 | Asiimov (Field-Tested)',
    'AWP | Asiimov (Field-Tested)',
    'Desert Eagle | Blaze (Factory New)',
    'Butterfly Knife | Doppler (Factory New)',
    'M4A4 | The Emperor (Factory New)'
  ];

  // Sample batch of items for arbitrage search
  const arbitrageSearchItems = [
    ...popularItems,
    'USP-S | Kill Confirmed (Minimal Wear)',
    'Glock-18 | Fade (Factory New)',
    'M4A1-S | Hyper Beast (Field-Tested)',
    'AWP | Neo-Noir (Field-Tested)',
    'AK-47 | Redline (Field-Tested)'
  ];

  const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

  // Check API status on component mount
  useEffect(() => {
    checkApiStatus();
  }, []);

  const checkApiStatus = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/market-comparison/status`);
      if (!response.data.buffAuthenticated) {
        setError('Buff API is not authenticated. Please check your credentials.');
      }
    } catch (err) {
      setError('Failed to connect to market comparison API.');
      console.error('API status check error:', err);
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      setError('Please enter an item name to search');
      return;
    }

    setLoading(true);
    setError(null);
    setComparisonResult(null);

    try {
      const response = await axios.get(`${API_URL}/api/market-comparison/item/${encodeURIComponent(searchTerm)}`);
      
      if (response.data.status === 'ok' && response.data.data) {
        setComparisonResult(response.data.data);
        setActiveTab('1'); // Switch to comparison tab
      } else {
        setError('No price data found for this item');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch price comparison');
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickSearch = (itemName: string) => {
    setSearchTerm(itemName);
    setTimeout(() => {
      handleSearch();
    }, 100);
  };

  const findArbitrageOpportunities = async () => {
    setLoading(true);
    setError(null);
    setArbitrageItems([]);

    try {
      const response = await axios.post(`${API_URL}/api/market-comparison/arbitrage`, {
        items: arbitrageSearchItems,
        minScore: 30
      });
      
      if (response.data.status === 'ok' && response.data.data) {
        setArbitrageItems(response.data.data.opportunities || []);
        setActiveTab('2'); // Switch to arbitrage tab
      } else {
        setError('No arbitrage opportunities found');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to find arbitrage opportunities');
      console.error('Arbitrage search error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'green';
    if (score >= 40) return 'orange';
    return 'red';
  };

  const getDiscountColor = (discount: number) => {
    if (discount >= 20) return 'green';
    if (discount >= 10) return 'blue';
    if (discount > 0) return 'orange';
    return 'red';
  };

  const arbitrageColumns = [
    {
      title: 'Item',
      dataIndex: 'buffName',
      key: 'buffName',
    },
    {
      title: 'Buff Price',
      dataIndex: ['prices', 'buff', 'USD'],
      key: 'buffPrice',
      render: (price: number) => `$${price.toFixed(2)}`,
    },
    {
      title: 'Steam Price',
      dataIndex: ['prices', 'steam', 'USD'],
      key: 'steamPrice',
      render: (price: number) => `$${price.toFixed(2)}`,
    },
    {
      title: 'Discount',
      dataIndex: ['comparison', 'discountPercent'],
      key: 'discount',
      render: (discount: number) => (
        <Tag color={getDiscountColor(discount)}>
          {discount.toFixed(2)}%
        </Tag>
      ),
    },
    {
      title: 'Potential Profit',
      dataIndex: ['comparison', 'difference', 'USD'],
      key: 'profit',
      render: (profit: number) => (
        <Text type={profit > 0 ? 'success' : 'danger'}>
          ${Math.abs(profit).toFixed(2)}
        </Text>
      ),
    },
    {
      title: 'Score',
      dataIndex: 'arbitrageScore',
      key: 'score',
      render: (score: number) => (
        <Tag color={getScoreColor(score)}>
          {score}/100
        </Tag>
      ),
    },
  ];

  return (
    <Card title="CS2 Market Price Comparison" style={{ width: '100%', maxWidth: 1200, margin: '0 auto' }}>
      {error && (
        <Alert
          message="Error"
          description={error}
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
          closable
          onClose={() => setError(null)}
        />
      )}

      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane 
          tab={<span><SearchOutlined /> Item Comparison</span>} 
          key="1"
        >
          <Space direction="vertical" style={{ width: '100%' }}>
            <Input.Search
              placeholder="Enter CS2 item name (e.g., AK-47 | Asiimov (Field-Tested))"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onSearch={handleSearch}
              enterButton
              loading={loading}
              size="large"
              style={{ marginBottom: 16 }}
            />
            
            <div style={{ marginBottom: 16 }}>
              <Text type="secondary">Quick Search: </Text>
              {popularItems.map((item) => (
                <Button 
                  key={item} 
                  type="link" 
                  onClick={() => handleQuickSearch(item)}
                  style={{ marginRight: 8 }}
                >
                  {item.split('|')[0].trim()}
                </Button>
              ))}
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: 24 }}>
                <Spin size="large" />
                <div style={{ marginTop: 16 }}>Loading price data...</div>
              </div>
            ) : comparisonResult ? (
              <div>
                <Card type="inner" title={comparisonResult.buffName} extra={<Tag color="blue">Last updated: {new Date(comparisonResult.timestamp).toLocaleString()}</Tag>}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
                    <div style={{ flex: 1, minWidth: 300 }}>
                      <Title level={5}>Price Comparison</Title>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <Text>Buff Price:</Text>
                        <Text strong>${comparisonResult.prices.buff.USD.toFixed(2)} / ¥{comparisonResult.prices.buff.CNY.toFixed(2)}</Text>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <Text>Steam Price:</Text>
                        <Text strong>${comparisonResult.prices.steam.USD.toFixed(2)} / ¥{comparisonResult.prices.steam.CNY.toFixed(2)}</Text>
                      </div>
                      <Divider style={{ margin: '12px 0' }} />
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <Text>Price Difference:</Text>
                        <Text type={comparisonResult.comparison.difference.USD < 0 ? 'danger' : 'success'}>
                          ${Math.abs(comparisonResult.comparison.difference.USD).toFixed(2)}
                        </Text>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <Text>Buff/Steam Ratio:</Text>
                        <Text>{(comparisonResult.comparison.ratio * 100).toFixed(2)}%</Text>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <Text>Discount on Buff:</Text>
                        <Tag color={getDiscountColor(comparisonResult.comparison.discountPercent)}>
                          {comparisonResult.comparison.discountPercent.toFixed(2)}%
                        </Tag>
                      </div>
                    </div>
                    
                    <div style={{ flex: 1, minWidth: 300 }}>
                      <Title level={5}>Arbitrage Analysis</Title>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <Text>Arbitrage Score:</Text>
                        <Tag color={getScoreColor(comparisonResult.arbitrageScore)}>
                          {comparisonResult.arbitrageScore}/100
                        </Tag>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <Text>Cheaper On:</Text>
                        <Text type={comparisonResult.comparison.isCheaperOnBuff ? 'success' : 'danger'}>
                          {comparisonResult.comparison.isCheaperOnBuff ? 'Buff (Good)' : 'Steam (Bad)'}
                        </Text>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <Text>Recommendation:</Text>
                        {comparisonResult.arbitrageScore >= 70 ? (
                          <Tag color="green">Strong Buy</Tag>
                        ) : comparisonResult.arbitrageScore >= 40 ? (
                          <Tag color="blue">Consider Buy</Tag>
                        ) : comparisonResult.arbitrageScore > 0 ? (
                          <Tag color="orange">Weak Opportunity</Tag>
                        ) : (
                          <Tag color="red">Not Recommended</Tag>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            ) : (
              <Alert
                message="No data"
                description="Search for an item to see price comparison data"
                type="info"
                showIcon
              />
            )}
          </Space>
        </TabPane>

        <TabPane 
          tab={<span><BarChartOutlined /> Arbitrage Opportunities</span>} 
          key="2"
        >
          <Space direction="vertical" style={{ width: '100%' }}>
            <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Title level={4} style={{ margin: 0 }}>
                <DollarOutlined /> Find Arbitrage Opportunities
              </Title>
              <Button 
                type="primary" 
                icon={<SyncOutlined />} 
                onClick={findArbitrageOpportunities}
                loading={loading}
              >
                Scan for Opportunities
              </Button>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: 24 }}>
                <Spin size="large" />
                <div style={{ marginTop: 16 }}>Scanning for arbitrage opportunities...</div>
              </div>
            ) : arbitrageItems.length > 0 ? (
              <Table 
                dataSource={arbitrageItems} 
                columns={arbitrageColumns}
                rowKey="buffName"
                pagination={{ pageSize: 10 }}
              />
            ) : (
              <Alert
                message="No arbitrage opportunities found"
                description="Click 'Scan for Opportunities' to search for potential arbitrage items"
                type="info"
                showIcon
              />
            )}
          </Space>
        </TabPane>
      </Tabs>
    </Card>
  );
};

export default MarketComparison;
