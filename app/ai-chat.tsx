import React, { useState, useEffect, useRef } from 'react';
// ... diğer importlar aynı kalacak

// Ödev kartı komponenti
const AssignmentCard = ({ assignment }: { assignment: any }) => {
  return (
    <View style={styles.assignmentCard}>
      <View style={[
        styles.assignmentBadge, 
        assignment.isCompleted && styles.completedBadge
      ]}>
        <Text style={styles.assignmentSubject}>
          {assignment.subject.substring(0, 3)}
        </Text>
      </View>
      <View style={styles.assignmentContent}>
        <Text 
          style={styles.assignmentText}
          numberOfLines={2}
          ellipsizeMode="tail"
        >
          {assignment.description}
        </Text>
        <Text style={styles.assignmentDate}>
          {new Date(assignment.dueDate).toLocaleDateString('tr-TR')}
        </Text>
      </View>
      <TouchableOpacity 
        style={[
          styles.assignmentStatus,
          assignment.isCompleted && styles.completedStatus
        ]}
        onPress={async () => {
          await AIChatService.updateAssignmentStatus(
            assignment.id,
            !assignment.isCompleted
          );
          loadUserInfo();
        }}
      >
        {assignment.isCompleted ? (
          <Check size={16} color={Colors.text.primary} />
        ) : (
          <Clock size={16} color={Colors.text.primary} />
        )}
      </TouchableOpacity>
    </View>
  );
};

// ... diğer kod aynı kalacak

const styles = StyleSheet.create({
  // ... diğer stiller aynı kalacak
  
  assignmentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.darkGray[800],
    borderRadius: BorderRadius.sm,
    padding: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  assignmentBadge: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.primary[700],
    justifyContent: 'center',
    alignItems: 'center',
  },
  completedBadge: {
    backgroundColor: Colors.success,
  },
  assignmentSubject: {
    fontFamily: 'Inter-Bold',
    fontSize: FontSizes.xs,
    color: Colors.text.primary,
  },
  assignmentContent: {
    flex: 1,
    marginLeft: Spacing.sm,
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
    width: 28,
    height: 28,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.darkGray[700],
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: Spacing.sm,
  },
  completedStatus: {
    backgroundColor: Colors.success,
  },
});