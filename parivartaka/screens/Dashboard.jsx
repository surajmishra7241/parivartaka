import React, { useState ,useEffect} from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList,LogBox, StyleSheet, Dimensions, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { useIsFocused } from '@react-navigation/native';
const { width } = Dimensions.get('window');

const cardData = [
    {
        id: '1',
        title: 'Tailer Resume',
        subtitle: 'Solve Your Resume Problems',
        icon: 'file-pdf-o',
        color: '#5DADE2',
        screen: 'ResumeTailoringScreen'
    },
    {
        id: '2',
        title: 'Object Identifier',
        subtitle: 'Identify any object and More',
        icon: 'search',
        color: '#F7DC6F',
        screen: 'ObjectIdentifier'
    },
    {
        id: '3',
        title: 'Image Tools',
        subtitle: 'Edit and Enhance Images',
        icon: 'image',
        color: '#F1948A',
        screen: 'ObjectIdentifier'
    },
    {
        id: '4',
        title: 'AI Tools',
        subtitle: 'AI-Powered Solutions',
        icon: 'magic',
        color: '#82E0AA',
        screen: 'ObjectIdentifier'
    },
    {
        id: '5',
        title: 'Video Tools',
        subtitle: 'Video Editing and More',
        icon: 'video-camera',
        color: '#F7DC6F',
        screen: 'ObjectIdentifier'
    },
    {
        id: '6',
        title: 'PDF Tools',
        subtitle: 'Solve Your PDF Problems',
        icon: 'file-pdf-o',
        color: '#5DADE2',
        screen: 'ResumeTailoringScreen'
    }

    // Add more cards if needed
];

const popularToolsData = [
    {
        id: '1',
        title: 'All Tools',
        icon: 'th-large',
        backgroundColor: '#007bff',
    },
    {
        id: '2',
        title: 'PDF Tools',
        icon: 'file-pdf-o',
        backgroundColor: '#ff5722',
    },
    {
        id: '3',
        title: 'Image Tools',
        icon: 'image',
        backgroundColor: '#4caf50',
    },
    {
        id: '4',
        title: 'Video Tools',
        icon: 'video-camera',
        backgroundColor: '#f39c12',
    },
    {
        id: '5',
        title: 'AI Tools',
        icon: 'magic',
        backgroundColor: '#9b59b6',
    },
    {
        id: '6',
        title: 'Text Tools',
        icon: 'font',
        backgroundColor: '#e74c3c',
    },
    {
        id: '7',
        title: 'Convert Tools',
        icon: 'exchange',
        backgroundColor: '#16a085',
    },
    // Add more buttons if needed
];


const toolCardData = [
    { id: '1', title: 'Essay Writer', subtitle: 'AI Write', icon: 'file-text-o', color: '#F7DC6F', screen: 'EassyWriting' },
    { id: '2', title: 'Content Improver', subtitle: 'AI Write', icon: 'edit', color: '#AED6F1', screen: 'ContentImprover' },
    { id: '3', title: 'Paragraph Writer', subtitle: 'AI Write', icon: 'paragraph', color: '#F5B7B1' , screen: 'ParagraphWriting'},
    { id: '4', title: 'AI Image Generator', subtitle: 'Image Tools', icon: 'picture-o', color: '#F9E79F', screen: 'ImageGeneratorDashboard' },
    { id: '5', title: 'Remove Background', subtitle: 'Image Tools', icon: 'scissors', color: '#A3E4D7', screen: 'EassyWriting' },
    { id: '6', title: 'Merge PDF', subtitle: 'PDF Tools', icon: 'files-o', color: '#D2B4DE', screen: 'EassyWriting' },
    { id: '7', title: 'Edit PDF', subtitle: 'PDF Tools', icon: 'file-pdf-o', color: '#A9CCE3', screen: 'EassyWriting' },
    { id: '8', title: 'PDF to JPG', subtitle: 'PDF Tools', icon: 'file-image-o', color: '#F1948A', screen: 'EassyWriting' },
    { id: '9', title: 'AI Translator', subtitle: 'AI Tools', icon: 'language', color: '#7FB3D5' , screen: 'AiTranslator'},
    { id: '10', title: 'Video Compressor', subtitle: 'Video Tools', icon: 'compress', color: '#FAD7A0' , screen: 'EassyWriting'},
    { id: '11', title: 'GIF Maker', subtitle: 'Image Tools', icon: 'film', color: '#F5CBA7' , screen: 'EassyWriting'},
    { id: '12', title: 'Text Summarizer', subtitle: 'AI Tools', icon: 'align-left', color: '#D7BDE2' , screen: 'TextSummarizer'},
    { id: '13', title: 'QR Code Generator', subtitle: 'Tools', icon: 'qrcode', color: '#F5B041', screen: 'QRGenerator' },
    { id: '14', title: 'SEO Optimizer', subtitle: 'AI Tools', icon: 'line-chart', color: '#85C1E9' , screen: 'EassyWriting'},
    { id: '15', title: 'Social Media Post Maker', subtitle: 'Image Tools', icon: 'share-alt', color: '#F7C6C7' , screen: 'EassyWriting'},
    { id: '16', title: 'YouTube Transcript', subtitle: 'YouTube Transcript', icon: 'youtube', color: '#F7C6C7' , screen: 'YouTubeTranscriptGenerator'},
    { id: '16', title: 'Interview Assistant', subtitle: 'Interview Assistant', icon: 'user', color: '#A9CCE3' , screen: 'InterviewAssistant'},
    // Add more cards as needed
];


const Dashboard = ({ navigation }) => {
    const isFocused = useIsFocused();
    useEffect(() => {
        LogBox.ignoreLogs(["VirtualizedLists should never be nested"])
    }, [isFocused]);

    const [showAllTools, setShowAllTools] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const initialTools = toolCardData.slice(0, 6);
    // Filter toolCardData based on searchQuery
    const filteredToolCardData = toolCardData.filter(tool =>
        tool.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const renderCard = ({ item }) => (
        <View style={[styles.card, { backgroundColor: item.color }]}>
            <Icon name={item.icon} size={50} color="#ffffff" style={styles.cardIcon} />
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardSubtitle}>{item.subtitle}</Text>
            <TouchableOpacity onPress={() => navigation.navigate(item.screen)}>
                <Text style={styles.cardLink}>Explore</Text>
            </TouchableOpacity>
        </View>
    );

    const renderToolCard = ({ item }) => (
        <TouchableOpacity style={[responsiveStyles.toolCard, { backgroundColor: item.color }]} onPress={e=>navigation.navigate(item.screen)}>
            <Icon name={item.icon} size={28} color="#ffffff" style={responsiveStyles.toolCardIcon} />
            <Text style={responsiveStyles.toolCardTitle}>{item.title}</Text>
            <Text style={responsiveStyles.toolCardSubtitle}>{item.subtitle}</Text>
        </TouchableOpacity>
    );

    return (
        <ScrollView style={styles.container}>
            {/* Header Section */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.iconContainer}>
                    <Icon name="search" size={24} style={styles.icon} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Parivartaka</Text>
                <TouchableOpacity style={styles.iconContainer}>
                    <Icon name="bars" size={24} style={styles.icon} />
                </TouchableOpacity>
            </View>

            {/* Description Bar */}
            <View style={styles.descriptionBar}>
                <Text style={styles.descriptionText}>Free. No Sign-Up Required. No Limits.</Text>
                <TouchableOpacity>
                    <Text style={styles.readMoreText}>Read More</Text>
                </TouchableOpacity>
            </View>

            {/* Main Title and Content */}
            <View style={styles.mainContent}>
                <Text style={styles.mainTitle}>Free Tools to Make <Text style={styles.highlightedText}>Everything</Text> Simple</Text>
                <Text style={styles.mainSubtitle}>We offer PDF, video, image and other online tools to make your life easier</Text>
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <Icon name="search" size={20} color="#007bff" style={styles.searchIcon} />
                <TextInput
                    placeholder="Search"
                    style={styles.searchInput}
                    value={searchQuery}
                    onChangeText={text => setSearchQuery(text)}
                />
                <TouchableOpacity style={styles.searchButton}>
                    <Text style={styles.searchButtonText}>Search</Text>
                </TouchableOpacity>
            </View>

            {/* Horizontal Scrollable Cards Section */}
            {searchQuery === '' && (
                <FlatList
                    data={cardData}
                    renderItem={renderCard}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.cardsContainer}
                    horizontal={true}
                    showsHorizontalScrollIndicator={false}
                    pagingEnabled={true}
                    decelerationRate="fast"
                    snapToAlignment="center"
                    bounces={true}
                />
            )}

            {/* Statistics Section */}
            {searchQuery === '' && (
                <View style={styles.statisticsContainer}>
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>10m</Text>
                        <Text style={styles.statLabel}>Files Converted</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>200+</Text>
                        <Text style={styles.statLabel}>Online Tools</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>1m</Text>
                        <Text style={styles.statLabel}>Active Users</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>500k</Text>
                        <Text style={styles.statLabel}>PDFs Created</Text>
                    </View>
                </View>
            )}

            {/* Popular Tools Section */}
            {searchQuery === '' && (
                <View style={styles.popularToolsContainer}>
                    <Text style={styles.popularTitle}>Our Most Popular Tools</Text>
                    <Text style={styles.popularSubtitle}>We present the best of the best. All free, no catch</Text>

                    {/* Horizontal ScrollView for Buttons */}
                    <ScrollView
                        horizontal={true}
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.buttonsContainer}
                    >
                        {popularToolsData.map(item => (
                            <TouchableOpacity
                                key={item.id}
                                style={[styles.toolButton, { backgroundColor: item.backgroundColor }]}
                            >
                                <Icon name={item.icon} size={18} color="#ffffff" />
                                <Text style={styles.buttonText}>{item.title}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            )}

            <View style={responsiveStyles.toolCardsContainer}>
                <FlatList
                    data={searchQuery === '' ? (showAllTools ? toolCardData : initialTools) : filteredToolCardData}
                    renderItem={renderToolCard}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={responsiveStyles.flatListContent}
                    numColumns={2}
                    columnWrapperStyle={responsiveStyles.columnWrapper}
                />

                {/* "ALL TOOLS" Button */}
                {!showAllTools && !searchQuery && (
                    <TouchableOpacity
                        style={responsiveStyles.allToolsButton}
                        onPress={() => setShowAllTools(true)}
                    >
                        <Text style={responsiveStyles.allToolsButtonText}>ALL TOOLS</Text>
                    </TouchableOpacity>
                )}
            </View>
        </ScrollView>
    );
};

// Styles
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f9fbfd',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 10,
        backgroundColor: '#ffffff',
        borderBottomLeftRadius: 25,
        borderBottomRightRadius: 25,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 5,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#333333',
        letterSpacing: 1.2,
        flex: 1,
        textAlign: 'center',
    },
    iconContainer: {
        marginLeft: 15,
        padding: 8,
        borderRadius: 20,
        backgroundColor: '#f0f0f0',
        elevation: 2,
    },
    icon: {
        color: '#007bff',
    },
    descriptionBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 10,
        backgroundColor: '#f0f0f0',
    },
    descriptionText: {
        fontSize: 14,
        color: '#000',
    },
    readMoreText: {
        fontSize: 14,
        color: '#007bff',
    },
    mainContent: {
        padding: 20,
        backgroundColor: '#fff',
        alignItems: 'center',
    },
    mainTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    highlightedText: {
        color: '#ff5722',
    },
    mainSubtitle: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginVertical: 10,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 10,
        backgroundColor: '#fff',
        borderRadius: 25,
        marginHorizontal: 20,
        marginTop: -20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
    },
    searchIcon: {
        marginHorizontal: 10,
    },
    searchInput: {
        flex: 1,
        height: 40,
        fontSize: 16,
    },
    searchButton: {
        backgroundColor: '#007bff',
        borderRadius: 20,
        paddingVertical: 6,
        paddingHorizontal: 12,
    },
    searchButtonText: {
        color: '#ffffff',
        fontSize: 16,
    },
    cardsContainer: {
        paddingVertical: 20,
        paddingLeft: 20,
    },
    card: {
        width: width * 0.8,
        borderRadius: 15,
        marginRight: 15,
        padding: 20,
        alignItems: 'center',
    },
    cardIcon: {
        marginBottom: 10,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#ffffff',
    },
    cardSubtitle: {
        fontSize: 14,
        color: '#ffffff',
    },
    cardLink: {
        fontSize: 14,
        color: '#ffffff',
        marginTop: 10,
        textDecorationLine: 'underline',
    },
    statisticsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingVertical: 20,
        backgroundColor: '#fff',
        borderRadius: 10,
        marginVertical: 10,
    },
    statItem: {
        alignItems: 'center',
    },
    statValue: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    statLabel: {
        fontSize: 14,
        color: '#666',
    },
    popularToolsContainer: {
        backgroundColor: '#e8f1f5',
        padding: 20,
        borderRadius: 20,
        marginVertical: 20,
        alignItems: 'center',
    },
    popularTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10,
    },
    popularSubtitle: {
        fontSize: 14,
        color: '#666',
        marginVertical: 10,
    },
    buttonsContainer: {
        flexDirection: 'row',
        padding: 10,
        backgroundColor: '#f9fbfd',
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    toolButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderRadius: 20,
        marginHorizontal: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    buttonText: {
        color: '#ffffff',
        fontSize: 16,
        marginLeft: 5,
    },
});

// Responsive Styles for tool cards
const responsiveStyles = StyleSheet.create({
    toolCardsContainer: {
        paddingHorizontal: 10,
        paddingBottom: 30,
    },
    toolCard: {
        width: width * 0.44,
        padding: 15,
        marginVertical: 10,
        marginHorizontal: 5,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
        elevation: 4,
    },
    toolCardIcon: {
        marginBottom: 10,
    },
    toolCardTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#ffffff',
    },
    toolCardSubtitle: {
        fontSize: 14,
        color: '#ffffff',
    },
    flatListContent: {
        paddingBottom: 20,
    },
    columnWrapper: {
        justifyContent: 'space-between',
    },
    allToolsButton: {
        backgroundColor: '#007bff',
        paddingVertical: 15,
        paddingHorizontal: 20,
        borderRadius: 25,
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 10,
        alignSelf: 'center',
        width: '80%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 5,
    },
    allToolsButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default Dashboard;
