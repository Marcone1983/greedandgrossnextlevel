import React, { useState, useEffect } from 'react';
import { RefreshControl, ScrollView, Dimensions } from 'react-native';
import {
  VStack,
  HStack,
  Text,
  Box,
  Pressable,
  Icon,
  Button,
  Badge,
  Divider,
  useColorModeValue,
  useToast,
  Spinner,
  Progress,
  SimpleGrid,
  StatGroup,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
} from 'native-base';
import { MaterialIcons } from 'react-native-vector-icons';
import { useTranslation } from 'react-i18next';
import { colors } from '@/constants/theme';
import { analyticsEngine, AnalyticsInsight, UserSegment } from '@/services/analyticsEngine';
import { analyticsCollector } from '@/services/analyticsCollector';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';

const screenWidth = Dimensions.get('window').width;

interface AnalyticsDashboard {
  overview: any;
  insights: AnalyticsInsight[];
  userSegments: UserSegment[];
  revenue: any;
  breeding: any;
  performance: any;
  generatedAt: Date;
  timeRange: number;
}

export default function AdminAnalyticsScreen() {
  const { t } = useTranslation();
  const toast = useToast();

  const [dashboard, setDashboard] = useState<AnalyticsDashboard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState(30);
  const [activeTab, setActiveTab] = useState<
    'overview' | 'users' | 'revenue' | 'breeding' | 'performance'
  >('overview');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const bgColor = useColorModeValue('gray.50', colors.darkBackground);
  const cardBg = useColorModeValue('white', colors.darkCard);
  const borderColor = useColorModeValue('gray.200', colors.darkBorder);
  const insightBgColor = useColorModeValue('gray.50', colors.darkBackground);

  useEffect(() => {
    loadAnalytics();
  }, [selectedTimeRange]);

  const loadAnalytics = async () => {
    try {
      setIsLoading(true);
      const data = await analyticsEngine.generateDashboardAnalytics('admin', selectedTimeRange);
      setDashboard({
        ...data,
        generatedAt: new Date(),
        timeRange: selectedTimeRange,
      });
    } catch (error) {
      toast.show({
        title: 'Errore',
        description: 'Impossibile caricare i dati analytics',
        colorScheme: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadAnalytics();
    setIsRefreshing(false);
    ReactNativeHapticFeedback.trigger('impactLight', {
      enableVibrateFallback: true,
      ignoreAndroidSystemSettings: false
    });
  };

  const renderTimeRangeSelector = () => (
    <HStack space={2} mb={4}>
      {[7, 30, 90].map(days => (
        <Button
          key={days}
          size="sm"
          variant={selectedTimeRange === days ? 'solid' : 'outline'}
          colorScheme={selectedTimeRange === days ? 'primary' : 'gray'}
          onPress={() => setSelectedTimeRange(days)}
        >
          {days}d
        </Button>
      ))}
    </HStack>
  );

  const renderTabSelector = () => (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} mb={4}>
      <HStack space={2}>
        {[
          { key: 'overview', label: 'Panoramica', icon: 'dashboard' },
          { key: 'users', label: 'Utenti', icon: 'people' },
          { key: 'revenue', label: 'Ricavi', icon: 'attach-money' },
          { key: 'breeding', label: 'Breeding', icon: 'nature' },
          { key: 'performance', label: 'Performance', icon: 'speed' },
        ].map(tab => (
          <Button
            key={tab.key}
            size="sm"
            variant={activeTab === tab.key ? 'solid' : 'outline'}
            colorScheme={activeTab === tab.key ? 'primary' : 'gray'}
            onPress={() => setActiveTab(tab.key as any)}
            leftIcon={<Icon as={MaterialIcons} name={tab.icon} />}
          >
            {tab.label}
          </Button>
        ))}
      </HStack>
    </ScrollView>
  );

  const renderOverviewTab = () => {
    if (!dashboard) return null;

    return (
      <VStack space={4}>
        {/* Key Metrics */}
        <Box bg={cardBg} p={4} borderRadius="lg" borderWidth={1} borderColor={borderColor}>
          <Text fontSize="lg" fontWeight="bold" mb={4}>
            Metriche Principali
          </Text>
          <SimpleGrid columns={2} spacing={4}>
            <Box>
              <Text fontSize="2xl" fontWeight="bold" color={colors.primary}>
                {dashboard.overview.activeUsers.current.toLocaleString()}
              </Text>
              <Text fontSize="sm" color="gray.500">
                Utenti Attivi
              </Text>
              <HStack alignItems="center" mt={1}>
                <Icon
                  as={MaterialIcons}
                  name={
                    dashboard.overview.activeUsers.growth >= 0 ? 'trending-up' : 'trending-down'
                  }
                  size="xs"
                  color={dashboard.overview.activeUsers.growth >= 0 ? 'green.500' : 'red.500'}
                />
                <Text
                  fontSize="xs"
                  color={dashboard.overview.activeUsers.growth >= 0 ? 'green.500' : 'red.500'}
                  ml={1}
                >
                  {Math.abs(dashboard.overview.activeUsers.growth)}%
                </Text>
              </HStack>
            </Box>

            <Box>
              <Text fontSize="2xl" fontWeight="bold" color={colors.primary}>
                {dashboard.overview.sessions.current.toLocaleString()}
              </Text>
              <Text fontSize="sm" color="gray.500">
                Sessioni
              </Text>
              <HStack alignItems="center" mt={1}>
                <Icon
                  as={MaterialIcons}
                  name={dashboard.overview.sessions.growth >= 0 ? 'trending-up' : 'trending-down'}
                  size="xs"
                  color={dashboard.overview.sessions.growth >= 0 ? 'green.500' : 'red.500'}
                />
                <Text
                  fontSize="xs"
                  color={dashboard.overview.sessions.growth >= 0 ? 'green.500' : 'red.500'}
                  ml={1}
                >
                  {Math.abs(dashboard.overview.sessions.growth)}%
                </Text>
              </HStack>
            </Box>

            <Box>
              <Text fontSize="2xl" fontWeight="bold" color={colors.primary}>
                €{dashboard.revenue.totalRevenue.toLocaleString()}
              </Text>
              <Text fontSize="sm" color="gray.500">
                Ricavi Totali
              </Text>
              <HStack alignItems="center" mt={1}>
                <Icon
                  as={MaterialIcons}
                  name={dashboard.revenue.revenueGrowth >= 0 ? 'trending-up' : 'trending-down'}
                  size="xs"
                  color={dashboard.revenue.revenueGrowth >= 0 ? 'green.500' : 'red.500'}
                />
                <Text
                  fontSize="xs"
                  color={dashboard.revenue.revenueGrowth >= 0 ? 'green.500' : 'red.500'}
                  ml={1}
                >
                  {Math.abs(dashboard.revenue.revenueGrowth)}%
                </Text>
              </HStack>
            </Box>

            <Box>
              <Text fontSize="2xl" fontWeight="bold" color={colors.primary}>
                {dashboard.breeding.totalSimulations.toLocaleString()}
              </Text>
              <Text fontSize="sm" color="gray.500">
                Simulazioni
              </Text>
              <Text fontSize="xs" color="gray.500" mt={1}>
                Breeding totali
              </Text>
            </Box>
          </SimpleGrid>
        </Box>

        {/* Insights */}
        <Box bg={cardBg} p={4} borderRadius="lg" borderWidth={1} borderColor={borderColor}>
          <Text fontSize="lg" fontWeight="bold" mb={4}>
            Insights Principali
          </Text>
          <VStack space={3}>
            {dashboard.insights.slice(0, 5).map((insight, index) => (
              <Box key={insight.id} p={3} bg={insightBgColor} borderRadius="md">
                <HStack justifyContent="space-between" alignItems="flex-start">
                  <VStack flex={1} space={1}>
                    <HStack alignItems="center" space={2}>
                      <Badge
                        colorScheme={
                          insight.priority === 'high'
                            ? 'red'
                            : insight.priority === 'medium'
                              ? 'orange'
                              : 'gray'
                        }
                        variant="solid"
                        size="sm"
                      >
                        {insight.priority.toUpperCase()}
                      </Badge>
                      <Text fontSize="sm" fontWeight="semibold">
                        {insight.title}
                      </Text>
                    </HStack>
                    <Text fontSize="xs" color="gray.600">
                      {insight.description}
                    </Text>
                  </VStack>
                  <VStack alignItems="flex-end">
                    <Text fontSize="sm" fontWeight="bold" color={colors.primary}>
                      {insight.value}
                    </Text>
                    <HStack alignItems="center">
                      <Icon
                        as={MaterialIcons}
                        name={
                          insight.trend === 'up'
                            ? 'trending-up'
                            : insight.trend === 'down'
                              ? 'trending-down'
                              : 'trending-flat'
                        }
                        size="xs"
                        color={
                          insight.trend === 'up'
                            ? 'green.500'
                            : insight.trend === 'down'
                              ? 'red.500'
                              : 'gray.500'
                        }
                      />
                      <Text
                        fontSize="xs"
                        color={
                          insight.trend === 'up'
                            ? 'green.500'
                            : insight.trend === 'down'
                              ? 'red.500'
                              : 'gray.500'
                        }
                      >
                        {insight.trendPercent}%
                      </Text>
                    </HStack>
                  </VStack>
                </HStack>
              </Box>
            ))}
          </VStack>
        </Box>

        {/* User Segments */}
        <Box bg={cardBg} p={4} borderRadius="lg" borderWidth={1} borderColor={borderColor}>
          <Text fontSize="lg" fontWeight="bold" mb={4}>
            Segmenti Utenti
          </Text>
          <VStack space={3}>
            {dashboard.userSegments.map((segment, index) => (
              <Box
                key={segment.id}
                p={3}
                borderWidth={1}
                borderColor={borderColor}
                borderRadius="md"
              >
                <HStack justifyContent="space-between" alignItems="flex-start">
                  <VStack flex={1} space={1}>
                    <Text fontSize="md" fontWeight="semibold">
                      {segment.name}
                    </Text>
                    <Text fontSize="xs" color="gray.600">
                      {segment.description}
                    </Text>
                    <HStack space={4} mt={2}>
                      <VStack alignItems="center">
                        <Text fontSize="sm" fontWeight="bold" color={colors.primary}>
                          {segment.userCount}
                        </Text>
                        <Text fontSize="xs" color="gray.500">
                          Utenti
                        </Text>
                      </VStack>
                      <VStack alignItems="center">
                        <Text fontSize="sm" fontWeight="bold" color={colors.primary}>
                          €{segment.averageRevenue.toFixed(2)}
                        </Text>
                        <Text fontSize="xs" color="gray.500">
                          ARPU
                        </Text>
                      </VStack>
                      <VStack alignItems="center">
                        <Text fontSize="sm" fontWeight="bold" color={colors.primary}>
                          {segment.retentionRate}%
                        </Text>
                        <Text fontSize="xs" color="gray.500">
                          Retention
                        </Text>
                      </VStack>
                    </HStack>
                  </VStack>
                </HStack>
              </Box>
            ))}
          </VStack>
        </Box>
      </VStack>
    );
  };

  const renderUsersTab = () => {
    if (!dashboard) return null;

    const userData = {
      labels: ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'],
      datasets: [
        {
          data: [20, 45, 28, 80, 99, 43, 78],
        },
      ],
    };

    return (
      <VStack space={4}>
        {/* User Activity Chart */}
        <Box bg={cardBg} p={4} borderRadius="lg" borderWidth={1} borderColor={borderColor}>
          <Text fontSize="lg" fontWeight="bold" mb={4}>
            Attività Utenti Settimanale
          </Text>
          <LineChart
            data={userData}
            width={screenWidth - 80}
            height={220}
            chartConfig={{
              backgroundColor: colors.primary,
              backgroundGradientFrom: colors.primary,
              backgroundGradientTo: colors.secondary,
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
              style: {
                borderRadius: 16,
              },
              propsForDots: {
                r: '6',
                strokeWidth: '2',
                stroke: '#ffa726',
              },
            }}
            bezier
            style={{
              marginVertical: 8,
              borderRadius: 16,
            }}
          />
        </Box>

        {/* User Segments Details */}
        <Box bg={cardBg} p={4} borderRadius="lg" borderWidth={1} borderColor={borderColor}>
          <Text fontSize="lg" fontWeight="bold" mb={4}>
            Analisi Segmenti
          </Text>
          <VStack space={4}>
            {dashboard.userSegments.map((segment, index) => (
              <Box key={segment.id}>
                <HStack justifyContent="space-between" alignItems="center" mb={2}>
                  <Text fontSize="md" fontWeight="semibold">
                    {segment.name}
                  </Text>
                  <Text fontSize="sm" color="gray.500">
                    {segment.userCount} utenti
                  </Text>
                </HStack>
                <Progress
                  value={(segment.userCount / 1000) * 100}
                  colorScheme="primary"
                  size="md"
                  mb={2}
                />
                <VStack space={1}>
                  {segment.insights.map((insight, i) => (
                    <Text key={i} fontSize="xs" color="gray.600">
                      • {insight}
                    </Text>
                  ))}
                </VStack>
                {index < dashboard.userSegments.length - 1 && <Divider mt={4} />}
              </Box>
            ))}
          </VStack>
        </Box>
      </VStack>
    );
  };

  const renderRevenueTab = () => {
    if (!dashboard) return null;

    const revenueByTier = Object.entries(dashboard.revenue.revenueByTier).map(
      ([tier, revenue]) => ({
        name: tier,
        revenue: revenue as number,
        color: tier === 'basic' ? '#FF6384' : tier === 'premium' ? '#36A2EB' : '#FFCE56',
        legendFontColor: '#7F7F7F',
        legendFontSize: 15,
      })
    );

    return (
      <VStack space={4}>
        {/* Revenue Overview */}
        <Box bg={cardBg} p={4} borderRadius="lg" borderWidth={1} borderColor={borderColor}>
          <Text fontSize="lg" fontWeight="bold" mb={4}>
            Panoramica Ricavi
          </Text>
          <SimpleGrid columns={2} spacing={4}>
            <VStack alignItems="center">
              <Text fontSize="xl" fontWeight="bold" color={colors.primary}>
                €{dashboard.revenue.totalRevenue.toLocaleString()}
              </Text>
              <Text fontSize="sm" color="gray.500">
                Ricavi Totali
              </Text>
            </VStack>
            <VStack alignItems="center">
              <Text fontSize="xl" fontWeight="bold" color="green.500">
                €{dashboard.revenue.recurringRevenue.toLocaleString()}
              </Text>
              <Text fontSize="sm" color="gray.500">
                Ricavi Ricorrenti
              </Text>
            </VStack>
            <VStack alignItems="center">
              <Text fontSize="xl" fontWeight="bold" color="blue.500">
                €{dashboard.revenue.avgRevenuePerUser.toFixed(2)}
              </Text>
              <Text fontSize="sm" color="gray.500">
                ARPU
              </Text>
            </VStack>
            <VStack alignItems="center">
              <Text fontSize="xl" fontWeight="bold" color="orange.500">
                {dashboard.revenue.conversionRate.toFixed(1)}%
              </Text>
              <Text fontSize="sm" color="gray.500">
                Conversione
              </Text>
            </VStack>
          </SimpleGrid>
        </Box>

        {/* Revenue by Tier */}
        <Box bg={cardBg} p={4} borderRadius="lg" borderWidth={1} borderColor={borderColor}>
          <Text fontSize="lg" fontWeight="bold" mb={4}>
            Ricavi per Abbonamento
          </Text>
          {revenueByTier.length > 0 && (
            <PieChart
              data={revenueByTier}
              width={screenWidth - 80}
              height={220}
              chartConfig={{
                color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
              }}
              accessor="revenue"
              backgroundColor="transparent"
              paddingLeft="15"
              absolute
            />
          )}
        </Box>

        {/* Revenue Projections */}
        <Box bg={cardBg} p={4} borderRadius="lg" borderWidth={1} borderColor={borderColor}>
          <Text fontSize="lg" fontWeight="bold" mb={4}>
            Proiezioni
          </Text>
          <HStack justifyContent="space-between" alignItems="center">
            <VStack>
              <Text fontSize="md" color="gray.600">
                Ricavi Proiettati (30gg)
              </Text>
              <Text fontSize="xl" fontWeight="bold" color={colors.primary}>
                €{dashboard.revenue.projectedRevenue.toLocaleString()}
              </Text>
            </VStack>
            <VStack alignItems="flex-end">
              <Text fontSize="md" color="gray.600">
                Crescita
              </Text>
              <HStack alignItems="center">
                <Icon
                  as={MaterialIcons}
                  name={dashboard.revenue.revenueGrowth >= 0 ? 'trending-up' : 'trending-down'}
                  color={dashboard.revenue.revenueGrowth >= 0 ? 'green.500' : 'red.500'}
                />
                <Text
                  fontSize="xl"
                  fontWeight="bold"
                  color={dashboard.revenue.revenueGrowth >= 0 ? 'green.500' : 'red.500'}
                >
                  {dashboard.revenue.revenueGrowth}%
                </Text>
              </HStack>
            </VStack>
          </HStack>
        </Box>
      </VStack>
    );
  };

  const renderBreedingTab = () => {
    if (!dashboard) return null;

    return (
      <VStack space={4}>
        {/* Breeding Overview */}
        <Box bg={cardBg} p={4} borderRadius="lg" borderWidth={1} borderColor={borderColor}>
          <Text fontSize="lg" fontWeight="bold" mb={4}>
            Panoramica Breeding
          </Text>
          <SimpleGrid columns={2} spacing={4}>
            <VStack alignItems="center">
              <Text fontSize="xl" fontWeight="bold" color={colors.primary}>
                {dashboard.breeding.totalSimulations.toLocaleString()}
              </Text>
              <Text fontSize="sm" color="gray.500">
                Simulazioni Totali
              </Text>
            </VStack>
            <VStack alignItems="center">
              <Text fontSize="xl" fontWeight="bold" color="green.500">
                {dashboard.breeding.userEngagement.avgSimulationsPerUser.toFixed(1)}
              </Text>
              <Text fontSize="sm" color="gray.500">
                Media/Utente
              </Text>
            </VStack>
          </SimpleGrid>
        </Box>

        {/* Popular Crosses */}
        <Box bg={cardBg} p={4} borderRadius="lg" borderWidth={1} borderColor={borderColor}>
          <Text fontSize="lg" fontWeight="bold" mb={4}>
            Incroci Popolari
          </Text>
          <VStack space={3}>
            {dashboard.breeding.popularCrosses.map((cross, index) => (
              <Box key={index} p={3} bg={insightBgColor} borderRadius="md">
                <HStack justifyContent="space-between" alignItems="center">
                  <VStack flex={1}>
                    <Text fontSize="sm" fontWeight="semibold">
                      {cross.parents.join(' × ')}
                    </Text>
                    <Text fontSize="xs" color="gray.600">
                      Incrocio #{index + 1}
                    </Text>
                  </VStack>
                  <VStack alignItems="flex-end">
                    <Text fontSize="lg" fontWeight="bold" color={colors.primary}>
                      {cross.count}
                    </Text>
                    <Text fontSize="xs" color="gray.500">
                      simulazioni
                    </Text>
                  </VStack>
                </HStack>
              </Box>
            ))}
          </VStack>
        </Box>

        {/* Trending Strains */}
        <Box bg={cardBg} p={4} borderRadius="lg" borderWidth={1} borderColor={borderColor}>
          <Text fontSize="lg" fontWeight="bold" mb={4}>
            Strain di Tendenza
          </Text>
          <VStack space={3}>
            {dashboard.breeding.trendingStrains.map((strain, index) => (
              <HStack key={index} justifyContent="space-between" alignItems="center">
                <HStack alignItems="center" space={3}>
                  <Badge colorScheme={strain.trend === 'up' ? 'green' : 'gray'} variant="solid">
                    #{index + 1}
                  </Badge>
                  <VStack>
                    <Text fontSize="sm" fontWeight="semibold">
                      {strain.name}
                    </Text>
                    <Text fontSize="xs" color="gray.600">
                      {strain.mentions} menzioni
                    </Text>
                  </VStack>
                </HStack>
                <Icon
                  as={MaterialIcons}
                  name={strain.trend === 'up' ? 'trending-up' : 'trending-flat'}
                  color={strain.trend === 'up' ? 'green.500' : 'gray.500'}
                />
              </HStack>
            ))}
          </VStack>
        </Box>
      </VStack>
    );
  };

  const renderPerformanceTab = () => {
    if (!dashboard) return null;

    return (
      <VStack space={4}>
        {/* Performance Metrics */}
        <Box bg={cardBg} p={4} borderRadius="lg" borderWidth={1} borderColor={borderColor}>
          <Text fontSize="lg" fontWeight="bold" mb={4}>
            Metriche Performance
          </Text>
          <VStack space={4}>
            <HStack justifyContent="space-between" alignItems="center">
              <Text fontSize="md">Tempo di Caricamento Medio</Text>
              <Text fontSize="lg" fontWeight="bold" color={colors.primary}>
                {dashboard.performance.avgLoadTime.toFixed(1)}s
              </Text>
            </HStack>
            <Divider />
            <HStack justifyContent="space-between" alignItems="center">
              <Text fontSize="md">Tasso di Errore</Text>
              <Text fontSize="lg" fontWeight="bold" color="orange.500">
                {dashboard.performance.errorRate.toFixed(1)}%
              </Text>
            </HStack>
            <Divider />
            <HStack justifyContent="space-between" alignItems="center">
              <Text fontSize="md">Tasso di Crash</Text>
              <Text fontSize="lg" fontWeight="bold" color="red.500">
                {dashboard.performance.crashRate.toFixed(1)}%
              </Text>
            </HStack>
          </VStack>
        </Box>

        {/* Performance Status */}
        <Box bg={cardBg} p={4} borderRadius="lg" borderWidth={1} borderColor={borderColor}>
          <Text fontSize="lg" fontWeight="bold" mb={4}>
            Stato Sistema
          </Text>
          <VStack space={3}>
            <HStack justifyContent="space-between" alignItems="center">
              <Text fontSize="md">API Response Time</Text>
              <Badge colorScheme="green" variant="solid">
                GOOD
              </Badge>
            </HStack>
            <HStack justifyContent="space-between" alignItems="center">
              <Text fontSize="md">Database Performance</Text>
              <Badge colorScheme="green" variant="solid">
                OPTIMAL
              </Badge>
            </HStack>
            <HStack justifyContent="space-between" alignItems="center">
              <Text fontSize="md">Memory System</Text>
              <Badge colorScheme="yellow" variant="solid">
                MONITORING
              </Badge>
            </HStack>
            <HStack justifyContent="space-between" alignItems="center">
              <Text fontSize="md">Analytics Collection</Text>
              <Badge colorScheme="green" variant="solid">
                ACTIVE
              </Badge>
            </HStack>
          </VStack>
        </Box>
      </VStack>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverviewTab();
      case 'users':
        return renderUsersTab();
      case 'revenue':
        return renderRevenueTab();
      case 'breeding':
        return renderBreedingTab();
      case 'performance':
        return renderPerformanceTab();
      default:
        return renderOverviewTab();
    }
  };

  if (isLoading) {
    return (
      <Box flex={1} justifyContent="center" alignItems="center" bg={bgColor}>
        <Spinner size="lg" color={colors.primary} />
        <Text mt={4} color="gray.500">
          Caricamento analytics...
        </Text>
      </Box>
    );
  }

  return (
    <Box flex={1} bg={bgColor}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
      >
        <VStack space={4} p={4}>
          {/* Header */}
          <Box>
            <Text fontSize="2xl" fontWeight="bold">
              Analytics Dashboard
            </Text>
            <Text fontSize="sm" color="gray.500">
              {dashboard && `Aggiornato: ${dashboard.generatedAt.toLocaleString('it-IT')}`}
            </Text>
          </Box>

          {/* Time Range Selector */}
          {renderTimeRangeSelector()}

          {/* Tab Selector */}
          {renderTabSelector()}

          {/* Tab Content */}
          {renderTabContent()}

          <Box h={10} />
        </VStack>
      </ScrollView>
    </Box>
  );
}
