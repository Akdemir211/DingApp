// Önceki importlar aynen kalacak...

const AssignmentsDrawer = ({ 
  assignments,
  onStatusChange
}: {
  assignments: UserAssignment[];
  onStatusChange: (id: string, isCompleted: boolean) => Promise<void>;
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <View style={styles.assignmentsDrawer}>
      <TouchableOpacity 
        style={styles.assignmentsHeader}
        onPress={() => setIsExpanded(!isExpanded)}
      >
        <View style={styles.assignmentsBadge}>
          <Text style={styles.assignmentsBadgeText}>
            {assignments.length}
          </Text>
        </View>
        <Text style={styles.assignmentsTitle}>Ödevlerim</Text>
        <ArrowRight 
          size={20} 
          color={Colors.text.secondary}
          style={[
            styles.assignmentsArrow,
            isExpanded && { transform: [{ rotate: '90deg' }] }
          ]} 
        />
      </TouchableOpacity>

      {isExpanded && (
        <View style={styles.assignmentsList}>
          {assignments.map((assignment) => (
            <View key={assignment.id} style={styles.assignmentItem}>
              <View style={styles.assignmentBadge}>
                <Text style={styles.assignmentSubject}>
                  {assignment.subject.substring(0, 3)}
                </Text>
              </View>
              <View style={styles.assignmentContent}>
                <Text style={styles.assignmentText}>
                  {assignment.description}
                </Text>
                <Text style={styles.assignmentDate}>
                  {`Teslim: ${assignment.dueDate.toLocaleDateString('tr-TR')}`}
                </Text>
              </View>
              <TouchableOpacity 
                style={[
                  styles.assignmentStatus,
                  assignment.isCompleted && styles.assignmentCompleted
                ]}
                onPress={() => onStatusChange(assignment.id, !assignment.isCompleted)}
              >
                <Text style={styles.assignmentStatusText}>
                  {assignment.isCompleted ? 'Tamamlandı' : 'Yapılacak'}
                </Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

// AIChatScreen bileşeni içinde header'dan sonra eklenecek:
<AssignmentsDrawer 
  assignments={userInfo?.assignments || []}
  onStatusChange={async (id, isCompleted) => {
    await AIChatService.updateAssignmentStatus(id, isCompleted);
    loadUserInfo();
  }}
/>

// Styles içine eklenecek:
assignmentsDrawer: {
  backgroundColor: Colors.darkGray[800],
  borderRadius: BorderRadius.md,
  marginBottom: Spacing.md,
},
assignmentsHeader: {
  flexDirection: 'row',
  alignItems: 'center',
  padding: Spacing.md,
},
assignmentsBadge: {
  backgroundColor: Colors.primary[500],
  width: 24,
  height: 24,
  borderRadius: BorderRadius.round,
  justifyContent: 'center',
  alignItems: 'center',
  marginRight: Spacing.sm,
},
assignmentsBadgeText: {
  fontFamily: 'Inter-Bold',
  fontSize: FontSizes.sm,
  color: Colors.text.primary,
},
assignmentsTitle: {
  fontFamily: 'Inter-SemiBold',
  fontSize: FontSizes.md,
  color: Colors.text.primary,
  flex: 1,
},
assignmentsArrow: {
  transform: [{ rotate: '0deg' }],
},
assignmentsList: {
  padding: Spacing.md,
  borderTopWidth: 1,
  borderTopColor: Colors.darkGray[700],
},
assignmentItem: {
  flexDirection: 'row',
  alignItems: 'center',
  marginBottom: Spacing.sm,
  backgroundColor: Colors.darkGray[700],
  padding: Spacing.sm,
  borderRadius: BorderRadius.sm,
},
assignmentBadge: {
  width: 32,
  height: 32,
  borderRadius: BorderRadius.round,
  backgroundColor: Colors.primary[700],
  justifyContent: 'center',
  alignItems: 'center',
  marginRight: Spacing.sm,
},
assignmentSubject: {
  fontFamily: 'Inter-Bold',
  fontSize: FontSizes.xs,
  color: Colors.text.primary,
},
assignmentContent: {
  flex: 1,
  marginRight: Spacing.sm,
},
assignmentText: {
  fontFamily: 'Inter-Regular',
  fontSize: FontSizes.sm,
  color: Colors.text.primary,
},
assignmentDate: {
  fontFamily: 'Inter-Regular',
  fontSize: FontSizes.xs,
  color: Colors.text.secondary,
  marginTop: 2,
},
assignmentStatus: {
  paddingHorizontal: Spacing.sm,
  paddingVertical: 4,
  borderRadius: BorderRadius.xs,
  backgroundColor: Colors.darkGray[600],
},
assignmentCompleted: {
  backgroundColor: Colors.success,
},
assignmentStatusText: {
  fontFamily: 'Inter-Regular',
  fontSize: FontSizes.xs,
  color: Colors.text.primary,
},