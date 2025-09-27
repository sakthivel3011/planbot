import React, { useState, useEffect } from 'react';

const WhatsAppSending = ({ isOpen, onClose, selectedMembers = [], eventName = '', companyName = '' }) => {
  const [messageTemplate, setMessageTemplate] = useState('event-confirmation');
  const [customMessage, setCustomMessage] = useState('');
  const [eventNameInput, setEventNameInput] = useState(eventName);
  const [companyNameInput, setCompanyNameInput] = useState(companyName);
  const [feedbackLink, setFeedbackLink] = useState('https://forms.google.com/your-feedback-form');
  const [processedMembers, setProcessedMembers] = useState([]);
  const [currentMemberIndex, setCurrentMemberIndex] = useState(0);
  const [sendingStatus, setSendingStatus] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Field selection for ID and other fields
  const [availableFields, setAvailableFields] = useState([]);
  const [selectedIdField, setSelectedIdField] = useState('id');
  const [selectedNameField, setSelectedNameField] = useState('Name');
  const [selectedPhoneField, setSelectedPhoneField] = useState('Phone');

  // Cleaner message templates
  const messageTemplates = {
    'event-confirmation': {
      name: '✅ Event Confirmation',
      template: `Hello *{name}*!

Your registration for *{eventName}* has been confirmed.

📅 *Event Details:*
• Event: {eventName}
• Type: {eventType}
• ID: {id}

Please check your email for venue details and schedule.

Best regards,
{companyName} Team`
    },
    'event-reminder': {
      name: '⏰ Event Reminder',
      template: `Hi *{name}*!

Reminder: Your event *{eventName}* is coming soon!

📅 *Event Details:*
• Event: {eventName}
• Type: {eventType}
• ID: {id}

Please arrive 15 minutes early.

See you there!
{companyName} Team`
    },
    'welcome': {
      name: '🎉 Welcome Message',
      template: `Welcome *{name}*! 🎉

Thank you for registering for *{eventName}*!

📅 *Your Details:*
• Event: {eventName}
• Type: {eventType}
• ID: {id}

We're excited to have you on board!

Best,
{companyName} Team`
    },
    'feedback': {
      name: '💬 Feedback Request',
      template: `Hello *{name}*!

Thank you for attending *{eventName}*!

We'd appreciate your feedback to help us improve:
{feedbackLink}

📅 *Event Details:*
• Event: {eventName}
• Type: {eventType}
• ID: {id}

Thank you!
{companyName} Team`
    },
    'custom': {
      name: '✏️ Custom Message',
      template: ''
    }
  };

  // Process member data when component receives new selectedMembers
  useEffect(() => {
    if (selectedMembers && selectedMembers.length > 0) {
      processMemberData(selectedMembers);
    }
  }, [selectedMembers]);

  // Fast update when field selections change
  useEffect(() => {
    if (processedMembers.length > 0) {
      fastUpdateMemberData();
    }
  }, [selectedIdField, selectedNameField, selectedPhoneField]);

  // Fast update function for field mapping changes
  const fastUpdateMemberData = () => {
    if (processedMembers.length === 0) return;

    const fastUpdated = processedMembers.map(member => {
      const originalMember = member.originalData;
      
      // Fast extract name using selected field
      let memberName = 'Participant';
      if (originalMember[selectedNameField] && originalMember[selectedNameField].toString().trim()) {
        memberName = originalMember[selectedNameField].toString().trim();
      }

      // Fast extract ID using selected field
      let memberId = `REG-${member.index + 1}`;
      if (originalMember[selectedIdField] && originalMember[selectedIdField].toString().trim()) {
        memberId = originalMember[selectedIdField].toString().trim();
      }

      // Fast extract phone using selected field
      let memberPhone = '';
      if (originalMember[selectedPhoneField] && originalMember[selectedPhoneField].toString().trim()) {
        let phoneValue = originalMember[selectedPhoneField].toString().replace(/[\s\-\(\)\.\+]/g, '');
        if (phoneValue.match(/^[\d]{10,15}$/)) {
          if (phoneValue.length === 10) {
            memberPhone = '91' + phoneValue;
          } else if (phoneValue.startsWith('91') && phoneValue.length === 12) {
            memberPhone = phoneValue;
          } else {
            memberPhone = phoneValue;
          }
        }
      }

      return {
        ...member,
        name: memberName,
        id: memberId,
        phone: memberPhone
      };
    });

    setProcessedMembers(fastUpdated);
    console.log('⚡ Fast updated member data');
  };

  const processMemberData = (members) => {
    console.log('Processing members:', members);
    
    // Get available fields from the first member
    if (members.length > 0) {
      const fields = Object.keys(members[0]);
      setAvailableFields(fields);
      console.log('📋 Available fields in sheet:', fields);
      
      // Auto-detect best ID field if not already selected
      if (selectedIdField === 'id' && !fields.includes('id')) {
        const possibleIdFields = fields.filter(field => 
          field.toLowerCase().includes('id') || 
          field.toLowerCase().includes('registration') ||
          field === 'id'
        );
        if (possibleIdFields.length > 0) {
          setSelectedIdField(possibleIdFields[0]);
          console.log(`🎯 Auto-selected ID field: ${possibleIdFields[0]}`);
        }
      }
    }
    
    const processed = members.map((member, index) => {
      // Extract name using selected field
      let memberName = 'Participant';
      if (member[selectedNameField] && member[selectedNameField].toString().trim()) {
        memberName = member[selectedNameField].toString().trim();
      } else {
        // Fallback to common name fields
        const nameFields = ['Name', 'name', 'NAME', 'fullName', 'FullName', 'participant', 'Participant'];
        for (const field of nameFields) {
          if (member[field] && typeof member[field] === 'string' && member[field].trim()) {
            memberName = member[field].trim();
            break;
          }
        }
      }

      // Extract ID using selected field
      let memberId = `REG-${index + 1}`;
      if (member[selectedIdField] && member[selectedIdField].toString().trim()) {
        memberId = member[selectedIdField].toString().trim();
        console.log(`✅ Using selected ID field "${selectedIdField}": ${memberId}`);
      } else {
        console.log(`❌ Selected ID field "${selectedIdField}" not found for ${memberName}`);
      }

      // Extract Event Type
      const eventTypeFields = ['Event Type', 'EventType', 'event_type', 'type', 'Type', 'category', 'Category', 'EventCategory'];
      let eventType = 'Event';
      
      for (const field of eventTypeFields) {
        if (member[field] && typeof member[field] === 'string' && member[field].trim()) {
          eventType = member[field].trim();
          break;
        }
      }

      // Extract phone number using selected field
      let memberPhone = '';
      if (member[selectedPhoneField] && member[selectedPhoneField].toString().trim()) {
        let phoneValue = member[selectedPhoneField].toString().replace(/[\s\-\(\)\.\+]/g, '');
        if (phoneValue.match(/^[\d]{10,15}$/)) {
          if (phoneValue.length === 10) {
            memberPhone = '91' + phoneValue;
          } else if (phoneValue.startsWith('91') && phoneValue.length === 12) {
            memberPhone = phoneValue;
          } else {
            memberPhone = phoneValue;
          }
          console.log(`📱 Using selected phone field "${selectedPhoneField}": ${memberPhone}`);
        }
      } else {
        // Fallback to common phone fields
        const phoneFields = ['Phone', 'phone', 'mobile', 'Mobile', 'contact', 'Contact', 'whatsapp'];
        for (const field of phoneFields) {
          if (member[field]) {
            let phoneValue = member[field].toString().replace(/[\s\-\(\)\.\+]/g, '');
            if (phoneValue.match(/^[\d]{10,15}$/)) {
              if (phoneValue.length === 10) {
                memberPhone = '91' + phoneValue;
              } else if (phoneValue.startsWith('91') && phoneValue.length === 12) {
                memberPhone = phoneValue;
              } else {
                memberPhone = phoneValue;
              }
              console.log(`📱 Fallback phone from "${field}": ${memberPhone}`);
              break;
            }
          }
        }
      }

      return {
        originalData: member,
        name: memberName,
        id: memberId,
        eventType: eventType,
        phone: memberPhone,
        index: index,
        allFields: Object.keys(member) // For debugging
      };
    });

    setProcessedMembers(processed);
    setCurrentMemberIndex(0);
    console.log('Final processed members:', processed);
  };

  const generateMessageForMember = (member) => {
    let message = '';
    
    if (messageTemplate === 'custom') {
      message = customMessage;
    } else {
      message = messageTemplates[messageTemplate].template;
    }

    return message
      .replace(/{name}/g, member.name)
      .replace(/{id}/g, member.id)
      .replace(/{eventType}/g, member.eventType)
      .replace(/{companyName}/g, companyNameInput || 'Our Organization')
      .replace(/{eventName}/g, eventNameInput || 'Our Event')
      .replace(/{feedbackLink}/g, feedbackLink);
  };

  const getCurrentMember = () => {
    if (processedMembers.length === 0) return null;
    return processedMembers[currentMemberIndex];
  };

  const sendToCurrentMember = () => {
    const member = getCurrentMember();
    if (!member || !member.phone) {
      setSendingStatus(`❌ No valid phone number for ${member?.name || 'member'}`);
      return;
    }

    const message = generateMessageForMember(member);
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${member.phone}?text=${encodedMessage}`;
    
    console.log(`Sending WhatsApp to: ${member.name} (${member.phone})`);
    console.log(`Message: ${message}`);
    
    window.open(whatsappUrl, '_blank');
    setSendingStatus(`✅ WhatsApp opened for ${member.name}`);
  };

  const sendToAllMembers = async () => {
    const membersWithPhone = processedMembers.filter(m => m.phone);
    if (membersWithPhone.length === 0) {
      setSendingStatus('❌ No members with valid phone numbers');
      return;
    }

    setIsProcessing(true);
    setSendingStatus(`⏳ Opening WhatsApp for ${membersWithPhone.length} members...`);
    
    for (let i = 0; i < membersWithPhone.length; i++) {
      const member = membersWithPhone[i];
      
      setTimeout(() => {
        const message = generateMessageForMember(member);
        const encodedMessage = encodeURIComponent(message);
        const whatsappUrl = `https://wa.me/${member.phone}?text=${encodedMessage}`;
        
        console.log(`Auto-sending ${i + 1}/${membersWithPhone.length} to: ${member.name}`);
        window.open(whatsappUrl, '_blank');
        
        if (i === membersWithPhone.length - 1) {
          setTimeout(() => {
            setSendingStatus(`✅ WhatsApp opened for all ${membersWithPhone.length} members`);
            setIsProcessing(false);
          }, 1000);
        }
      }, i * 2500);
    }
  };

  const goToNextMember = () => {
    if (currentMemberIndex < processedMembers.length - 1) {
      setCurrentMemberIndex(currentMemberIndex + 1);
      setSendingStatus('');
    }
  };

  const goToPreviousMember = () => {
    if (currentMemberIndex > 0) {
      setCurrentMemberIndex(currentMemberIndex - 1);
      setSendingStatus('');
    }
  };

  const currentMember = getCurrentMember();
  const hasValidPhone = currentMember && currentMember.phone;
  const membersWithPhone = processedMembers.filter(m => m.phone);

  if (!isOpen) return null;

  return (
    <div className="whatsapp-modal-backdrop">
      <div className="whatsapp-modal">
        <div className="whatsapp-modal-header">
          <h2>📱 WhatsApp Messages</h2>
          <button className="modal-close-btn" onClick={onClose}>×</button>
        </div>

        <div className="whatsapp-modal-content">
          {/* Progress Section */}
          {processedMembers.length > 0 && (
            <div className="whatsapp-section">
              <h3>📊 Progress</h3>
              <div className="progress-container">
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${((currentMemberIndex + 1) / processedMembers.length) * 100}%` }}
                  ></div>
                </div>
                <div className="progress-text">
                  Member {currentMemberIndex + 1} of {processedMembers.length} 
                  ({membersWithPhone.length} have valid phones)
                </div>
              </div>
            </div>
          )}

          {/* Current Member Details */}
          {currentMember && (
            <div className="whatsapp-section current-member-section">
              <h3>👤 Current Member</h3>
              <div className="member-details">
                <div className="detail-item">
                  <strong>Name:</strong> {currentMember.name}
                </div>
                <div className="detail-item">
                  <strong>ID:</strong> {currentMember.id}
                </div>
                <div className="detail-item">
                  <strong>Event Type:</strong> {currentMember.eventType}
                </div>
                <div className="detail-item">
                  <strong>Phone:</strong> 
                  {currentMember.phone ? (
                    <span className="phone-valid">✅ +{currentMember.phone}</span>
                  ) : (
                    <span className="phone-invalid">❌ No phone number</span>
                  )}
                </div>
                {/* Debug info */}
                <div className="detail-item debug-info">
                  <small>Available fields: {currentMember.allFields?.join(', ')}</small>
                </div>
              </div>
            </div>
          )}

          {/* Field Selection */}
          {availableFields.length > 0 && (
            <div className="whatsapp-section">
              <h3>📋 Sheet Field Mapping</h3>
              <p className="field-help">Select which fields from your sheet to use for each data type:</p>
              <div className="form-row">
                <div className="form-group">
                  <label>ID Field:</label>
                  <select
                    className="form-input"
                    value={selectedIdField}
                    onChange={(e) => {
                      setSelectedIdField(e.target.value);
                      // Fast update handled by useEffect
                    }}
                  >
                    {availableFields.map(field => (
                      <option key={field} value={field}>{field}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Name Field:</label>
                  <select
                    className="form-input"
                    value={selectedNameField}
                    onChange={(e) => {
                      setSelectedNameField(e.target.value);
                      // Fast update handled by useEffect
                    }}
                  >
                    {availableFields.map(field => (
                      <option key={field} value={field}>{field}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Phone Field:</label>
                  <select
                    className="form-input"
                    value={selectedPhoneField}
                    onChange={(e) => {
                      setSelectedPhoneField(e.target.value);
                      // Fast update handled by useEffect
                    }}
                  >
                    {availableFields.map(field => (
                      <option key={field} value={field}>{field}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="field-preview">
                <small>
                  <strong>Available fields in your sheet:</strong> {availableFields.join(', ')}
                </small>
              </div>
            </div>
          )}

          {/* Event Details */}
          <div className="whatsapp-section">
            <h3>🎯 Event Details</h3>
            <div className="form-row">
              <div className="form-group">
                <label>Company Name:</label>
                <input
                  type="text"
                  className="form-input"
                  value={companyNameInput}
                  onChange={(e) => setCompanyNameInput(e.target.value)}
                  placeholder="Your company name"
                />
              </div>
              <div className="form-group">
                <label>Event Name:</label>
                <input
                  type="text"
                  className="form-input"
                  value={eventNameInput}
                  onChange={(e) => setEventNameInput(e.target.value)}
                  placeholder="Event name"
                />
              </div>
            </div>
            <div className="form-group">
              <label>Feedback Form Link:</label>
              <input
                type="text"
                className="form-input"
                value={feedbackLink}
                onChange={(e) => setFeedbackLink(e.target.value)}
                placeholder="https://forms.google.com/your-feedback-form"
              />
            </div>
          </div>

          {/* Message Template Selection */}
          <div className="whatsapp-section">
            <h3>📝 Message Template</h3>
            <div className="template-grid">
              {Object.entries(messageTemplates).map(([key, template]) => (
                <label key={key} className="template-option">
                  <input
                    type="radio"
                    name="template"
                    value={key}
                    checked={messageTemplate === key}
                    onChange={(e) => setMessageTemplate(e.target.value)}
                  />
                  <span className="template-name">{template.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Message Preview */}
          <div className="whatsapp-section">
            <h3>👀 Message Preview</h3>
            {messageTemplate === 'custom' ? (
              <div>
                <textarea
                  className="message-editor"
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  placeholder="Type your custom message... Use {name}, {id}, {companyName}, {eventName} as placeholders"
                  rows="6"
                />
                <small className="helper-text">
                  Placeholders: {'{name}'}, {'{id}'}, {'{eventType}'}, {'{companyName}'}, {'{eventName}'}, {'{feedbackLink}'}
                </small>
              </div>
            ) : (
              <div className="message-preview">
                <pre>{currentMember ? generateMessageForMember(currentMember) : 'Select a member to preview'}</pre>
              </div>
            )}
          </div>

          {/* Status Message */}
          {sendingStatus && (
            <div className={`status-message ${
              sendingStatus.includes('✅') ? 'success' : 
              sendingStatus.includes('❌') ? 'error' : 'processing'
            }`}>
              {sendingStatus}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="whatsapp-modal-actions">
          <div className="navigation-buttons">
            <button 
              className="btn btn-secondary" 
              onClick={goToPreviousMember}
              disabled={currentMemberIndex === 0 || processedMembers.length === 0}
            >
              ← Previous
            </button>
            
            <span className="member-counter">
              {processedMembers.length > 0 ? `${currentMemberIndex + 1} / ${processedMembers.length}` : '0 / 0'}
            </span>
            
            <button 
              className="btn btn-secondary" 
              onClick={goToNextMember}
              disabled={currentMemberIndex === processedMembers.length - 1 || processedMembers.length === 0}
            >
              Next →
            </button>
          </div>

          <div className="action-buttons">
            <button className="btn btn-secondary" onClick={onClose} disabled={isProcessing}>
              Close
            </button>
            
            <button 
              className="btn btn-info" 
              onClick={sendToAllMembers}
              disabled={membersWithPhone.length === 0 || isProcessing}
            >
              📱 Send to All ({membersWithPhone.length})
            </button>
            
            <button 
              className="btn btn-success" 
              onClick={sendToCurrentMember}
              disabled={!hasValidPhone || isProcessing}
            >
              📱 Send to Current
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .whatsapp-modal-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
        }

        .whatsapp-modal {
          background: white;
          border-radius: 10px;
          width: 90%;
          max-width: 800px;
          max-height: 90vh;
          overflow: hidden;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        }

        .whatsapp-modal-header {
          background: #25D366;
          color: white;
          padding: 15px 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .whatsapp-modal-header h2 {
          margin: 0;
          font-size: 1.5rem;
        }

        .modal-close-btn {
          background: none;
          border: none;
          color: white;
          font-size: 24px;
          cursor: pointer;
          padding: 0;
          width: 30px;
          height: 30px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .modal-close-btn:hover {
          background: rgba(255, 255, 255, 0.2);
        }

        .whatsapp-modal-content {
          padding: 20px;
          max-height: calc(90vh - 180px);
          overflow-y: auto;
        }

        .whatsapp-section {
          margin-bottom: 20px;
          padding-bottom: 15px;
          border-bottom: 1px solid #eee;
        }

        .whatsapp-section:last-child {
          border-bottom: none;
        }

        .whatsapp-section h3 {
          margin: 0 0 15px 0;
          color: #333;
          font-size: 1.1rem;
        }

        .progress-container {
          background: #f5f5f5;
          padding: 15px;
          border-radius: 8px;
        }

        .progress-bar {
          width: 100%;
          height: 10px;
          background: #e0e0e0;
          border-radius: 5px;
          overflow: hidden;
          margin-bottom: 10px;
        }

        .progress-fill {
          height: 100%;
          background: #25D366;
          transition: width 0.3s ease;
        }

        .progress-text {
          text-align: center;
          font-weight: 500;
          color: #555;
        }

        .current-member-section {
          background: #f8f9fa;
          padding: 15px;
          border-radius: 8px;
          border: 1px solid #e9ecef;
        }

        .member-details {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .detail-item {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .debug-info {
          font-size: 0.8em;
          color: #666;
          margin-top: 10px;
        }

        .phone-valid {
          color: #28a745;
          font-weight: 500;
        }

        .phone-invalid {
          color: #dc3545;
          font-weight: 500;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
        }

        .form-group label {
          margin-bottom: 5px;
          font-weight: 500;
          color: #555;
        }

        .form-input {
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 5px;
          font-size: 14px;
        }

        .form-input:focus {
          outline: none;
          border-color: #25D366;
          box-shadow: 0 0 0 2px rgba(37, 211, 102, 0.2);
        }

        .field-help {
          color: #666;
          font-size: 14px;
          margin-bottom: 15px;
          background: #f8f9fa;
          padding: 10px;
          border-radius: 5px;
          border-left: 4px solid #25D366;
        }

        .field-preview {
          background: #f0f8ff;
          padding: 10px;
          border-radius: 5px;
          margin-top: 10px;
          border: 1px solid #e0e0e0;
        }

        .field-preview small {
          color: #555;
          font-size: 12px;
        }

        .template-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 10px;
        }

        .template-option {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 5px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .template-option:hover {
          border-color: #25D366;
          background: #f8fff8;
        }

        .template-option input[type="radio"]:checked + .template-name {
          color: #25D366;
          font-weight: 500;
        }

        .message-editor {
          width: 100%;
          padding: 15px;
          border: 1px solid #ddd;
          border-radius: 5px;
          font-family: inherit;
          font-size: 14px;
          resize: vertical;
          min-height: 150px;
        }

        .message-preview {
          background: #f8f9fa;
          padding: 15px;
          border-radius: 5px;
          border: 1px solid #e9ecef;
        }

        .message-preview pre {
          margin: 0;
          white-space: pre-wrap;
          font-family: inherit;
          font-size: 14px;
          line-height: 1.4;
        }

        .helper-text {
          color: #666;
          font-size: 12px;
          margin-top: 5px;
          display: block;
        }

        .status-message {
          padding: 12px;
          border-radius: 5px;
          font-weight: 500;
          text-align: center;
        }

        .status-message.success {
          background: #d4edda;
          color: #155724;
          border: 1px solid #c3e6cb;
        }

        .status-message.error {
          background: #f8d7da;
          color: #721c24;
          border: 1px solid #f5c6cb;
        }

        .status-message.processing {
          background: #d1ecf1;
          color: #0c5460;
          border: 1px solid #bee5eb;
        }

        .whatsapp-modal-actions {
          padding: 15px 20px;
          border-top: 1px solid #eee;
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: #f8f9fa;
        }

        .navigation-buttons {
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .member-counter {
          font-weight: 500;
          color: #555;
          min-width: 80px;
          text-align: center;
        }

        .action-buttons {
          display: flex;
          gap: 10px;
        }

        .btn {
          padding: 8px 16px;
          border: none;
          border-radius: 5px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.2s;
        }

        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn-secondary {
          background: #6c757d;
          color: white;
        }

        .btn-secondary:hover:not(:disabled) {
          background: #5a6268;
        }

        .btn-info {
          background: #17a2b8;
          color: white;
        }

        .btn-info:hover:not(:disabled) {
          background: #138496;
        }

        .btn-success {
          background: #28a745;
          color: white;
        }

        .btn-success:hover:not(:disabled) {
          background: #218838;
        }

        @media (max-width: 768px) {
          .whatsapp-modal {
            width: 95%;
            margin: 10px;
          }

          .form-row {
            grid-template-columns: 1fr;
          }

          .template-grid {
            grid-template-columns: 1fr;
          }

          .whatsapp-modal-actions {
            flex-direction: column;
            gap: 15px;
          }

          .navigation-buttons, .action-buttons {
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
};

export default WhatsAppSending;