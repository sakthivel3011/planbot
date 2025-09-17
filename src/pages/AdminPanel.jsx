import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import '../assets/css/Adminpanel.css';

// --- SVG Icons ---
const MenuIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="12" x2="21" y2="12"></line>
    <line x1="3" y1="6" x2="21" y2="6"></line>
    <line x1="3" y1="18" x2="21" y2="18"></line>
  </svg>
);

// --- Helper Components ---
const ConfirmationModal = ({ isOpen, title, message, onConfirm, onCancel }) => {
  if (!isOpen) return null;
  return (
    <div className="confirm-modal-backdrop">
      <div className="confirm-modal">
        <h3>{title}</h3>
        <p>{message}</p>
        <div className="confirm-modal-actions">
          <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
          <button className="btn btn-danger" onClick={onConfirm}>Delete</button>
        </div>
      </div>
    </div>
  );
};

const AlertModal = ({ isOpen, title, message, onClose }) => {
  if (!isOpen) return null;
  return (
    <div className="confirm-modal-backdrop">
      <div className="confirm-modal">
        <h3>{title}</h3>
        <p>{message}</p>
        <div className="confirm-modal-actions">
          <button className="btn btn-primary" onClick={onClose}>OK</button>
        </div>
      </div>
    </div>
  );
};

const PromptModal = ({ isOpen, title, message, onConfirm, onCancel }) => {
  const [inputValue, setInputValue] = useState('');

  if (!isOpen) return null;

  return (
    <div className="confirm-modal-backdrop">
      <div className="confirm-modal">
        <h3>{title}</h3>
        <p>{message}</p>
        <input 
          type="text"
          className="form-input"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
        />
        <div className="confirm-modal-actions">
          <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
          <button className="btn btn-primary" onClick={() => onConfirm(inputValue)}>Confirm</button>
        </div>
      </div>
    </div>
  );
};

const ColumnWidthsPromptModal = ({ isOpen, title, headers, onConfirm, onCancel }) => {
  const [widths, setWidths] = useState({});
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setError('');
      const initialWidth = 100 / headers.length;
      const initialWidths = headers.reduce((acc, h) => {
        acc[h] = initialWidth.toFixed(2);
        return acc;
      }, {});
      setWidths(initialWidths);
    }
  }, [isOpen, headers]);

  const handleWidthChange = (header, value) => {
    setWidths(prev => ({ ...prev, [header]: value }));
  };

  const handleConfirm = () => {
    const numericWidths = Object.values(widths).map(v => parseFloat(v));
    if (numericWidths.some(isNaN)) {
      setError('Please enter valid numbers for all widths.');
      return;
    }
    const totalWidth = numericWidths.reduce((a, b) => a + b, 0);
    if (Math.round(totalWidth) > 100 || Math.round(totalWidth) < 100) { // check for exactly 100
      setError(`Total width must be 100%. Current total is ${totalWidth.toFixed(2)}%.`);
      return;
    }
    onConfirm(widths);
  };

  if (!isOpen) return null;

  const total = Object.values(widths).map(v => parseFloat(v) || 0).reduce((a, b) => a + b, 0);

  return (
    <div className="confirm-modal-backdrop">
      <div className="confirm-modal" style={{maxWidth: '500px'}}>
        <h3>{title}</h3>
        <p>Adjust column widths in percentage (%). Total must be 100%.</p>
        {error && <p style={{color: 'red'}}>{error}</p>}
        <div className="column-widths-inputs" style={{display: 'grid', gridTemplateColumns: '1fr 100px', gap: '10px', alignItems: 'center', maxHeight: '300px', overflowY: 'auto', paddingRight: '10px'}}>
          {headers.map(h => (
            <React.Fragment key={h}>
              <label>{h}</label>
              <input
                type="number"
                step="0.1"
                className="form-input"
                value={widths[h] || ''}
                onChange={(e) => handleWidthChange(h, e.target.value)}
              />
            </React.Fragment>
          ))}
        </div>
        <p style={{textAlign: 'right', marginTop: '10px', fontWeight: 'bold', color: Math.round(total) === 100 ? 'green' : 'red'}}>Total: {total.toFixed(2)}%</p>
        <div className="confirm-modal-actions">
          <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
          <button className="btn btn-primary" onClick={handleConfirm}>Confirm</button>
        </div>
      </div>
    </div>
  );
};

const CellContent = ({ content }) => {
  const urlRegex = /^(https?:\/\/[^\s\/$.?#].[^\s]*)$/i;
  if (typeof content === 'string' && urlRegex.test(content)) {
    return <a href={content} target="_blank" rel="noopener noreferrer">{content}</a>;
  }
  return String(content);
};

const emailTemplates = {
    raaga2k25: () => `Dear {{Name}},

Thank you for registering for RAAGA-2K25!

Your registration has been confirmed. We look forward to seeing you at the event.

Best regards,
The RAAGA-2K25 Team`,
    registration: (eventName) => `Dear {{Name}},

Thank you for registering for ${eventName}!

Your registration has been confirmed. We look forward to seeing you at the event.

Best regards,
The ${eventName} Team`,
    reminder: (eventName) => `Hi {{Name}},

Just a friendly reminder that ${eventName} is coming up soon! We're excited to see you there.

Event Details:
Date: [Event Date]
Time: [Event Time]
Location: [Event Location]

Best,
The ${eventName} Team`,
    thankyou: (eventName) => `Dear {{Name}},

Thank you for attending ${eventName}! We hope you had a great time.

We would love to hear your feedback. Please reply to this email with your thoughts.

Best regards,
The ${eventName} Team`,
    feedback: (eventName) => `Hi {{Name}},

We'd love to get your feedback on ${eventName}. Please take a moment to fill out our survey: [Survey Link]

Your feedback is important to us and will help us improve future events.

Thanks,
The ${eventName} Team`,
    promo: (eventName) => `Hello {{Name}},

As a valued member of our community, we're excited to offer you a special discount for our next event!

Use code PROMO25 for 25% off your ticket for [Next Event Name].

We hope to see you there!

Best,
The ${eventName} Team`,
  };

const MessagingModal = ({ isOpen, title, headers, onSend, onCancel, type }) => {
  const [column, setColumn] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [template, setTemplate] = useState('');
  const [eventName, setEventName] = useState('RAAGA-2K25');

  useEffect(() => {
    if (isOpen) {
      if (headers.length > 0) {
        let defaultColumn = headers[0];
        if (type === 'email') {
          const emailHeader = headers.find(h => h.toLowerCase().includes('email'));
          if (emailHeader) defaultColumn = emailHeader;
        } else if (type === 'whatsapp') {
          const phoneHeader = headers.find(h => h.toLowerCase().includes('phone') || h.toLowerCase().includes('whatsapp'));
          if (phoneHeader) defaultColumn = phoneHeader;
        }
        setColumn(defaultColumn);
      }
      setTemplate('raaga2k25');
      setEventName('RAAGA-2K25');
      if (type === 'email') {
          setSubject('Regarding RAAGA-2K25'); // Default subject
      }
    }
  }, [headers, type, isOpen]);

  useEffect(() => {
    if (isOpen) {
      if (template in emailTemplates) {
        setMessage(emailTemplates[template](eventName));
      } else if (template === 'custom') {
        setMessage('');
      }
    }
  }, [template, eventName, isOpen]);

  if (!isOpen) return null;

  const getColumnLabel = () => {
    if (type === 'email') return 'Select column with email addresses';
    if (type === 'whatsapp') return 'Select column with phone numbers';
    return 'Select Column';
  };

  return (
    <div className="confirm-modal-backdrop">
      <div className="confirm-modal" style={{maxWidth: '600px', maxHeight: '80vh', overflowY: 'auto'}}>
        <h3>{title}</h3>
        <div className="form-group">
          <label>{getColumnLabel()}</label>
          <select className="form-input" value={column} onChange={(e) => setColumn(e.target.value)}>
            {headers.map(h => <option key={h} value={h}>{h}</option>)}
          </select>
        </div>
        {type === 'email' && (
          <div className="form-group">
            <label>Subject</label>
            <input 
              type="text"
              className="form-input"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>
        )}
        <div className="form-group">
          <label>Template</label>
          <select className="form-input" value={template} onChange={(e) => setTemplate(e.target.value)}>
            <option value="raaga2k25">RAAGA-2K25 Registration</option>
            <option value="registration">Generic Registration</option>
            <option value="reminder">Event Reminder</option>
            <option value="thankyou">Thank You</option>
            <option value="feedback">Feedback Request</option>
            <option value="promo">Promotional Offer</option>
            <option value="custom">Custom Message</option>
          </select>
        </div>
        {template !== 'custom' && (
          <div className="form-group">
            <label>Event Name</label>
            <input 
              type="text"
              className="form-input"
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
            />
          </div>
        )}
        <div className="form-group">
          <label>Message</label>
          <textarea className="form-input" rows="10" value={message} onChange={(e) => setMessage(e.target.value)}></textarea>
          <small>You can use placeholders like {'{{Column Name}}'}. For example: {'{{Name}}'}.</small>
        </div>
        <div className="confirm-modal-actions">
          <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
          <button className="btn btn-primary" onClick={() => onSend(column, subject, message)}>Send</button>
        </div>
      </div>
    </div>
  );
};

const ColumnSelectorModal = ({ isOpen, headers, onConfirm, onCancel, title }) => {
  const [selectedColumns, setSelectedColumns] = useState(new Set(headers));

  useEffect(() => {
    if (isOpen) {
      setSelectedColumns(new Set(headers));
    }
  }, [isOpen, headers]);

  const toggleColumn = (column) => {
    const newSet = new Set(selectedColumns);
    if (newSet.has(column)) {
      newSet.delete(column);
    } else {
      newSet.add(column);
    }
    setSelectedColumns(newSet);
  };

  const toggleSelectAll = () => {
    if (selectedColumns.size === headers.length) {
      setSelectedColumns(new Set());
    } else {
      setSelectedColumns(new Set(headers));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal-content" style={{maxWidth: '400px'}}>
        <div className="modal-header">
          <h2>{title || 'Select Columns'}</h2>
          <button onClick={onCancel} className="modal-close-btn">&times;</button>
        </div>
        <div className="modal-body">
          <button className="btn btn-secondary" onClick={toggleSelectAll} style={{marginBottom: '1rem'}}>
            {selectedColumns.size === headers.length ? 'Deselect All' : 'Select All'}
          </button>
          <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
            {headers.map(header => (
              <label key={header} className="checkbox-label" style={{display: 'block', marginBottom: '0.5rem'}}>
                <input
                  type="checkbox"
                  checked={selectedColumns.has(header)}
                  onChange={() => toggleColumn(header)}
                />
                {header}
              </label>
            ))}
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
          <button className="btn btn-primary" onClick={() => onConfirm(Array.from(selectedColumns))}>
            Export
          </button>
        </div>
      </div>
    </div>
  );
};

const SheetSelector = ({ sheets, activeSheet, onSelectSheet, onAddSheet, onDeleteSheet, onBack }) => {
  const [newSheetUrl, setNewSheetUrl] = useState('');
  const [sheetName, setSheetName] = useState('');

  return (
    <div className="sheet-selector">
      <div className="sidebar-header">
        <button className="back-btn" onClick={onBack} title="Back to main menu">
          <MenuIcon />
        </button>
        <h3>Google Sheets</h3>
      </div>
      <div className="add-sheet-form">
        <h4>
          <span role="img" aria-label="sheet" style={{ marginRight: 8 }}>📊</span>
          Add New Sheet
        </h4>
        <input
          type="text"
          placeholder="Sheet Name"
          value={sheetName}
          onChange={(e) => setSheetName(e.target.value)}
          className="form-input"
        />
        <input
          type="text"
          placeholder="Paste Google Sheet URL or ID"
          value={newSheetUrl}
          onChange={(e) => setNewSheetUrl(e.target.value)}
          className="form-input"
        />
        <button
          className="btn btn-primary"
          onClick={() => {
            if (newSheetUrl.trim() && sheetName.trim()) {
              onAddSheet(newSheetUrl.trim(), sheetName.trim());
              setNewSheetUrl('');
              setSheetName('');
            }
          }}
        >
          Add Sheet
        </button>
      </div>
      <div className="sheets-list">
        {sheets.map((sheet) => (
          <div
            key={sheet.id}
            className={`sheet-item ${activeSheet === sheet.id ? 'active' : ''}`}
          >
            <span className="sheet-icon" onClick={() => onSelectSheet(sheet.id)}>📊</span>
            <span className="sheet-name" onClick={() => onSelectSheet(sheet.id)}>{sheet.name}</span>
            <button className="action-btn delete-btn" title="Delete Sheet" onClick={() => onDeleteSheet(sheet.id)}>
              <span className="icon-delete"></span>
            </button>
          </div>
        ))}
      </div>
      <div style={{ textAlign: 'center', marginTop: 24, fontSize: 32 }}>
        <span role="img" aria-label="sheet">📊</span>
      </div>
    </div>
  );
};

// Team Management Modal
const TeamManagementModal = ({ isOpen, onClose, teamMembers, onAddMember, onRemoveMember, onShareLink }) => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('viewer');

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Team Management</h2>
          <button onClick={onClose} className="modal-close-btn">&times;</button>
        </div>
        <div className="modal-body">
          <div className="team-section">
            <h3>Share Access</h3>
            <div className="form-group">
              <input
                type="email"
                placeholder="Enter email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-input"
              />
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="form-input"
              >
                <option value="viewer">Viewer</option>
                <option value="editor">Editor</option>
              </select>
              <button
                className="btn btn-primary"
                onClick={() => {
                  if (email.trim()) {
                    onAddMember(email, role);
                    setEmail('');
                  }
                }}
              >
                Add Member
              </button>
            </div>
          </div>

          <div className="team-section">
            <h3>Team Members ({teamMembers.length})</h3>
            <div className="team-list">
              {teamMembers.map((member, index) => (
                <div key={index} className="team-member">
                  {editingMemberEmail === member.email ? (
                    <>
                      <span className="member-email">{member.email}</span>
                      <select
                        value={editingMemberRole}
                        onChange={(e) => setEditingMemberRole(e.target.value)}
                        className="form-input small-select"
                      >
                        <option value="viewer">Viewer</option>
                        <option value="editor">Editor</option>
                      </select>
                      <button
                        className="action-btn save-btn"
                        onClick={() => onSaveMemberEdit(member.email, editingMemberRole)}
                        title="Save changes"
                      >
                        <span className="icon-save"></span>
                      </button>
                      <button
                        className="action-btn cancel-btn"
                        onClick={() => setEditingMemberEmail(null)}
                        title="Cancel edit"
                      >
                        <span className="icon-cancel"></span>
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="member-email">{member.email}</span>
                      <span className="member-role">{member.role}</span>
                      <button
                        className="action-btn edit-btn"
                        onClick={() => handleEditMember(member.email, member.role)}
                        title="Edit member role"
                      >
                        <span className="icon-edit"></span>
                      </button>
                      <button
                        className="action-btn delete-btn"
                        onClick={() => onRemoveMember(member.email)}
                        title="Remove member"
                      >
                        <span className="icon-delete"></span>
                      </button>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="team-section">
            <h3>Shareable Link</h3>
            <button className="btn btn-secondary" onClick={onShareLink}>
              Generate Share Link
            </button>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};

// PDF Header Configuration Modal
const PdfConfigModal = ({ isOpen, onClose, onSave, currentConfig }) => {
  const [title, setTitle] = React.useState(currentConfig.title || '');
  const [headerImage, setHeaderImage] = React.useState(currentConfig.headerImage || null);
  const [showTimestamp, setShowTimestamp] = React.useState(currentConfig.showTimestamp !== false);

  // Reset state when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setTitle(currentConfig.title || '');
      setHeaderImage(currentConfig.headerImage || null);
      setShowTimestamp(currentConfig.showTimestamp !== false);
    }
  }, [isOpen, currentConfig]);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setHeaderImage(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal-content">
        <div className="modal-header">
          <h2>PDF Export Configuration</h2>
          <button onClick={onClose} className="modal-close-btn">&times;</button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label>PDF Title</label>
            <input
              type="text"
              className="form-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter title for PDF exports"
            />
          </div>
          <div className="form-group">
            <label>Header Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="form-input"
            />
            {headerImage && (
              <>
                <div className="image-preview" style={{ width: '100%', margin: '0 -20px' }}>
                  <img
                    src={headerImage}
                    alt="Header preview"
                    style={{ width: '100%', height: 'auto', display: 'block', margin: 0, border: 0 }}
                  />
                </div>
                <button className="btn btn-danger" style={{marginTop: '10px'}} onClick={() => setHeaderImage(null)}>Remove Image</button>
              </>
            )}
          </div>
          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={showTimestamp}
                onChange={(e) => setShowTimestamp(e.target.checked)}
              />
              Show timestamp on PDF exports
            </label>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => onSave({ title, headerImage, showTimestamp }) }>
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
};

const ColumnAliasModal = ({ isOpen, headers, aliases, onConfirm, onCancel }) => {
  const [newAliases, setNewAliases] = useState({});

  useEffect(() => {
    if (isOpen) {
      setNewAliases(aliases);
    }
  }, [isOpen, aliases]);

  const handleAliasChange = (header, alias) => {
    setNewAliases(prev => ({ ...prev, [header]: alias }));
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal-content" style={{maxWidth: '500px'}}>
        <div className="modal-header">
          <h2>Edit Column Names</h2>
          <button onClick={onCancel} className="modal-close-btn">&times;</button>
        </div>
        <div className="modal-body" style={{maxHeight: '400px', overflowY: 'auto'}}>
          {headers.map(h => (
            <div className="form-group" key={h}>
              <label>{h}</label>
              <input
                type="text"
                className="form-input"
                value={newAliases[h] || ''}
                onChange={(e) => handleAliasChange(h, e.target.value)}
                placeholder="Enter new column name"
              />
            </div>
          ))}
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
          <button className="btn btn-primary" onClick={() => onConfirm(newAliases)}>Save</button>
        </div>
      </div>
    </div>
  );
};

const SavedSelectionDetailModal = ({ isOpen, onClose, selection, columnAliases, headers }) => {
  if (!isOpen || !selection) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal-content" style={{ maxWidth: '800px' }}>
        <div className="modal-header">
          <h2>Details for: {selection.name} ({selection.data.length} rows)</h2>
          <button onClick={onClose} className="modal-close-btn">&times;</button>
        </div>
        <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
          {selection.data.length === 0 ? (
            <p>No data in this selection.</p>
          ) : (
            <div className="modal-table-container">
              <table className="data-table modal-table">
                <thead>
                  <tr>
                    {headers.map(h => <th key={h}>{columnAliases[h] || h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {selection.data.map(row => (
                    <tr key={row.id}>
                      {headers.map(h => <td key={h}>{String(row[h])}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};

const SavedSelectionsModal = ({ isOpen, onClose, savedSelections, onLoadSelection, onDeleteSelection, onRenameSelection, onViewDetails }) => {
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedSelectionForDetail, setSelectedSelectionForDetail] = useState(null);

  const handleViewDetails = (selection) => {
    setSelectedSelectionForDetail(selection);
    setIsDetailModalOpen(true);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal-content" style={{maxWidth: '500px'}}>
        <div className="modal-header">
          <h2>Manage Saved Selections</h2>
          <button onClick={onClose} className="modal-close-btn">&times;</button>
        </div>
        <div className="modal-body" style={{maxHeight: '400px', overflowY: 'auto'}}>
          {savedSelections.length === 0 ? (
            <p>No selections saved yet.</p>
          ) : (
            <ul className="saved-selections-list">
              {savedSelections.map((selection, index) => (
                <li key={index} className="saved-selection-item">
                  <span>{selection.name} ({selection.data.length} rows)</span>
                  <div className="actions">
                    <button className="btn btn-info btn-sm" onClick={() => handleViewDetails(selection)}>View Details</button>
                    <button className="btn btn-primary btn-sm" onClick={() => onLoadSelection(selection.ids)}>Load</button>
                    <button className="btn btn-secondary btn-sm" onClick={() => onRenameSelection(selection.name)}>Edit Name</button>
                    <button className="btn btn-danger btn-sm" onClick={() => onDeleteSelection(selection.name)}>Delete</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Close</button>
        </div>
      </div>
      <SavedSelectionDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        selection={selectedSelectionForDetail}
        columnAliases={columnAliases}
        headers={headers}
      />
    </div>
  );
};

// --- Main Component ---
const AdminPanel = () => {
  // --- State Management ---
  const [theme, setTheme] = useState('light');
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return localStorage.getItem('isLoggedIn') === 'true';
  });
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [sheets, setSheets] = useState(() => {
    const savedSheets = localStorage.getItem('sheets');
    return savedSheets ? JSON.parse(savedSheets) : [];
  });
  const [activeSheetId, setActiveSheetId] = useState(() => {
    const savedActiveSheetId = localStorage.getItem('activeSheetId');
    return savedActiveSheetId ? savedActiveSheetId : null;
  });
  const [sheetData, setSheetData] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [originalHeaders, setOriginalHeaders] = useState([]);
  const [columnAliases, setColumnAliases] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({});
  const [globalSearch, setGlobalSearch] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [highlightedRows, setHighlightedRows] = useState(new Set());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [messagingModal, setMessagingModal] = useState({ isOpen: false, type: null });
  const [editingRowId, setEditingRowId] = useState(null);
  const [editedRowData, setEditedRowData] = useState(null);
  const [confirmation, setConfirmation] = useState({ isOpen: false });
  const [alert, setAlert] = useState({ isOpen: false });
  const [prompt, setPrompt] = useState({ isOpen: false });
  const [widthsPrompt, setWidthsPrompt] = useState({ isOpen: false, headers: [], onConfirm: () => {}, onCancel: () => {} });
  const [columnSelector, setColumnSelector] = useState({ isOpen: false, title: '', onConfirm: () => {}, onCancel: () => {} });
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showSheetSelector, setShowSheetSelector] = useState(false);
  const [columnWidths, setColumnWidths] = useState({});
  const resizingRef = useRef({ isResizing: false, header: null, startX: 0, startWidth: 0 });
  const [manageColumnsMode, setManageColumnsMode] = useState(false);
  const [aliasModalOpen, setAliasModalOpen] = useState(false);
  const [isSaveSelectionModalOpen, setIsSaveSelectionModalOpen] = useState(false);
  const [savedSelections, setSavedSelections] = useState(() => {
    const saved = localStorage.getItem('savedSelections');
    return saved ? JSON.parse(saved) : [];
  });
  const [isManageSelectionsModalOpen, setIsManageSelectionsModalOpen] = useState(false);
  
  // New state variables
  const [teamModalOpen, setTeamModalOpen] = useState(false);
  const [pdfConfigModalOpen, setPdfConfigModalOpen] = useState(false);
  const [pdfConfig, setPdfConfig] = useState(() => {
    const savedConfig = localStorage.getItem('pdfConfig');
    return savedConfig ? JSON.parse(savedConfig) : {
      title: 'PLANBOT Registrations',
      headerImage: null,
      showTimestamp: true
    };
  });
  const [teamMembers, setTeamMembers] = useState(() => {
    const savedMembers = localStorage.getItem('teamMembers');
    return savedMembers ? JSON.parse(savedMembers) : [];
  });
  const [userRole, setUserRole] = useState('admin'); // admin, editor, viewer
  const [shareLink, setShareLink] = useState('');
  const [editingMemberEmail, setEditingMemberEmail] = useState(null);
  const [editingMemberRole, setEditingMemberRole] = useState('viewer');

  // Fix: Add missing handleEditMember function
  const handleEditMember = (email, role) => {
    setEditingMemberEmail(email);
    setEditingMemberRole(role);
  };

  // --- Handlers ---
  const handleResizeMove = useCallback((e) => {
    if (!resizingRef.current.isResizing) return;
    const { header, startX, startWidth } = resizingRef.current;
    const newWidth = startWidth + (e.clientX - startX);
    if (newWidth > 50) { // Minimum width
      setColumnWidths(prev => ({ ...prev, [header]: newWidth }));
    }
  }, []);

  const handleResizeEnd = useCallback(() => {
    resizingRef.current.isResizing = false;
    window.removeEventListener('mousemove', handleResizeMove);
    window.removeEventListener('mouseup', handleResizeEnd);
  }, [handleResizeMove]);

  const handleResizeStart = (header, e) => {
    e.preventDefault();
    e.stopPropagation();
    resizingRef.current = {
      isResizing: true,
      header: header,
      startX: e.clientX,
      startWidth: e.target.closest('th').offsetWidth,
    };
    window.addEventListener('mousemove', handleResizeMove);
    window.addEventListener('mouseup', handleResizeEnd);
  };

  const handleRestoreColumns = () => {
    setHeaders(originalHeaders);
    localStorage.removeItem(`hiddenColumns_${activeSheetId}`);
  };

  // --- Effects ---
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('isLoggedIn', isLoggedIn);
  }, [isLoggedIn]);

  useEffect(() => {
    localStorage.setItem('sheets', JSON.stringify(sheets));
  }, [sheets]);

  useEffect(() => {
    if (activeSheetId) {
      localStorage.setItem('activeSheetId', activeSheetId);
    }
  }, [activeSheetId]);

  useEffect(() => {
    localStorage.setItem('pdfConfig', JSON.stringify(pdfConfig));
  }, [pdfConfig]);

  useEffect(() => {
    localStorage.setItem('teamMembers', JSON.stringify(teamMembers));
  }, [teamMembers]);

  useEffect(() => {
    localStorage.setItem('savedSelections', JSON.stringify(savedSelections));
  }, [savedSelections]);

  useEffect(() => {
    return () => {
      window.removeEventListener('mousemove', handleResizeMove);
      window.removeEventListener('mouseup', handleResizeEnd);
    };
  }, [handleResizeMove, handleResizeEnd]);

  const fetchSheetData = useCallback(async () => {
    if (!activeSheetId) {
      setError('Please select a Google Sheet.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(`https://docs.google.com/spreadsheets/d/${activeSheetId}/gviz/tq?tqx=out:csv&gid=0`)}`);
      if (!response.ok) throw new Error('Failed to fetch data. Make sure the sheet is public and the URL is correct.');
      
      const csvData = await response.text();
      if (!csvData) throw new Error('No data found in the sheet.');

      const lines = csvData.trim().split(/\r\n|\n/);
      const parseRow = (rowStr) => {
          const result = [];
          let current = '';
          let inQuotes = false;
          for (let i = 0; i < rowStr.length; i++) {
              const char = rowStr[i];
              if (char === '"' && (i === 0 || rowStr[i-1] !== '\\')) {
                  if (inQuotes && rowStr[i+1] === '"') {
                      current += '"';
                      i++;
                  } else {
                      inQuotes = !inQuotes;
                  }
              } else if (char === ',' && !inQuotes) {
                  result.push(current);
                  current = '';
              } else {
                  current += char;
              }
          }
          result.push(current);
          return result;
      };

      const parsedHeaders = parseRow(lines.shift() || '');
      const validHeaders = parsedHeaders.filter(h => h.trim() !== '');
      
      setOriginalHeaders(validHeaders);

      const hiddenColumnsKey = `hiddenColumns_${activeSheetId}`;
      const hiddenColumns = JSON.parse(localStorage.getItem(hiddenColumnsKey) || '[]');
      const visibleHeaders = validHeaders.filter(h => !hiddenColumns.includes(h));
      setHeaders(visibleHeaders);

      const columnAliasesKey = `columnAliases_${activeSheetId}`;
      const savedAliases = JSON.parse(localStorage.getItem(columnAliasesKey) || '{}');
      setColumnAliases(savedAliases);

      const parsedData = lines.map((line, index) => {
        const rowValues = parseRow(line);
        return validHeaders.reduce((obj, header, i) => {
          obj[header] = rowValues[i] || '';
          return obj;
        }, { id: `row-${index}` });
      });

      setSheetData(parsedData);
      setSelectedRows(new Set());
      setHighlightedRows(new Set());
      setFilters({});
      setGlobalSearch('');
      setCurrentPage(1);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [activeSheetId]);

  useEffect(() => {
    if (isLoggedIn && activeSheetId) {
      fetchSheetData();
    }
  }, [activeSheetId, isLoggedIn, fetchSheetData]);

  // --- Data Processing Memos ---
  const filteredData = useMemo(() => {
    let result = [...sheetData];
    if (globalSearch.trim()) {
      const searchTerm = globalSearch.trim().toLowerCase();
      result = result.filter(row =>
        headers.some(header =>
          String(row[header]).toLowerCase().includes(searchTerm)
        )
      );
    }
    result = result.filter(row =>
      headers.every(header =>
        !filters[header] || String(row[header]).toLowerCase().includes(String(filters[header]).toLowerCase())
      )
    );
    return result;
  }, [sheetData, filters, globalSearch, headers]);

  const sortedData = useMemo(() => {
    let sortableData = [...filteredData];
    if (sortConfig.key !== null) {
      sortableData.sort((a, b) => {
        const valA = a[sortConfig.key] || '';
        const valB = b[sortConfig.key] || '';
        if (valA < valB) return sortConfig.direction === 'ascending' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'ascending' ? 1 : -1;
        return 0;
      });
    }
    return sortableData;
  }, [filteredData, sortConfig]);

  const paginatedData = useMemo(() =>
    sortedData.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage),
    [sortedData, currentPage, rowsPerPage]
  );

  // --- Handlers ---
  const handleLogin = (e) => {
    e.preventDefault();
    if (username === 'sakthi' && password === 'vel@3011') {
      setIsLoggedIn(true);
      setError('');
    } else {
      setError('Invalid credentials. Try again.');
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setSheetData([]);
    setUsername('');
    setPassword('');
  };

  const addNewSheet = (sheetUrlOrId, sheetName) => {
    const sheetId = sheetUrlOrId.match(/spreadsheets\/d\/([a-zA-Z0-9-_]+)/)?.[1] || sheetUrlOrId;
    if (sheets.some(sheet => sheet.id === sheetId)) {
      setAlert({ isOpen: true, title: 'Notice', message: 'This sheet is already in your list.' });
      return;
    }
    const newSheets = [...sheets, { id: sheetId, name: sheetName }];
    setSheets(newSheets);
    setActiveSheetId(sheetId);
    setShowSheetSelector(false);
    setAlert({ isOpen: true, title: 'Success', message: `Sheet "${sheetName}" added successfully.` });
  };

  const deleteSheet = (idToDelete) => {
    setConfirmation({
      isOpen: true,
      title: 'Delete Sheet',
      message: 'Are you sure you want to delete this sheet? This action cannot be undone.',
      onConfirm: () => {
        const newSheets = sheets.filter(sheet => sheet.id !== idToDelete);
        setSheets(newSheets);
        if (activeSheetId === idToDelete) {
          const newActiveId = newSheets.length > 0 ? newSheets[0].id : null;
          setActiveSheetId(newActiveId);
        }
        setConfirmation({ isOpen: false });
        setAlert({ isOpen: true, title: 'Success', message: 'Sheet deleted successfully.' });
      },
      onCancel: () => setConfirmation({ isOpen: false })
    });
  };

  const handleDeleteRow = (idToDelete) => {
    setConfirmation({
      isOpen: true,
      title: 'Delete Row',
      message: 'Are you sure you want to delete this row? This action cannot be undone.',
      onConfirm: () => {
        setSheetData(prev => prev.filter(row => row.id !== idToDelete));
        setConfirmation({ isOpen: false });
        setAlert({ isOpen: true, title: 'Success', message: 'Row deleted successfully.' });
      },
      onCancel: () => setConfirmation({ isOpen: false })
    });
  };

  const handleDeleteColumn = (columnToHide) => {
    setConfirmation({
      isOpen: true,
      title: 'Hide Column',
      message: `Are you sure you want to hide the "${columnToHide}" column?`,
      onConfirm: () => {
        const newHeaders = headers.filter(h => h !== columnToHide);
        setHeaders(newHeaders);

        const hiddenColumnsKey = `hiddenColumns_${activeSheetId}`;
        const hiddenColumns = JSON.parse(localStorage.getItem(hiddenColumnsKey) || '[]');
        const newHiddenColumns = [...hiddenColumns, columnToHide];
        localStorage.setItem(hiddenColumnsKey, JSON.stringify(newHiddenColumns));

        setConfirmation({ isOpen: false });
        setAlert({ isOpen: true, title: 'Success', message: `Column "${columnToHide}" hidden.` });
      },
      onCancel: () => setConfirmation({ isOpen: false })
    });
  };

  const exportToCsv = (filename, rows, columns) => {
    if (!rows || rows.length === 0) {
      setAlert({ isOpen: true, title: 'Export Notice', message: 'There is no data to export.' });
      return;
    }
    const keys = columns ? ['S.No', ...columns] : ['S.No', ...headers.filter(h => h !== 'id')];
    if (!keys || keys.length === 0) {
      setAlert({ isOpen: true, title: 'Export Notice', message: 'Please select at least one column to export.' });
      return;
    }
    const csvContent = [
      keys.join(','),
      ...rows.map((row, index) =>
        keys.map(k => {
          if (k === 'S.No') return index + 1;
          let cell = row[k] === null || row[k] === undefined ? '' : String(row[k]);
          if (/^[\d\s+()\-]{7,}$/.test(cell) && !cell.includes(',')) {
            cell = `=\"\t${cell}\"`;
          } else if (cell.includes(',') || cell.includes('"') || cell.includes('\n')) {
            cell = `"${cell.replace(/"/g, '""')}"`;
          }
          return cell;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.setAttribute('href', URL.createObjectURL(blob));
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePdfExport = (exportAll, columns) => {
    const rowsToExport = exportAll ? sortedData : sheetData.filter(row => selectedRows.has(row.id));
    if (rowsToExport.length === 0) {
      setAlert({ isOpen: true, title: 'Export Notice', message: 'No data available to export.' });
      return;
    }

    const headersToExport = columns || headers;
    const allHeadersForWidths = ['S.No.', ...headersToExport];

    setPrompt({
      isOpen: true,
      title: 'Export to PDF',
      message: 'Enter a title for the PDF export:',
      onConfirm: (pdfTitle) => {
        if (pdfTitle === null) {
            setPrompt({ isOpen: false });
            return;
        }
        setPrompt({ isOpen: false });

        setWidthsPrompt({
            isOpen: true,
            headers: allHeadersForWidths,
            onConfirm: (customWidths) => {
                setWidthsPrompt({ isOpen: false });

                const printWindow = window.open('', '', 'width=1200,height=800');
                if(!printWindow) {
                  setAlert({ isOpen: true, title: 'Error', message: 'Could not open a new window. Please disable your pop-up blocker.' });
                  return;
                }

                const now = new Date();
                const eventTime = pdfConfig.showTimestamp ? now.toLocaleString() : '';
                const finalTitle = pdfTitle || pdfConfig.title;

                let colgroup = '<colgroup>';
                allHeadersForWidths.forEach(h => {
                    colgroup += `<col style="width:${customWidths[h]}%">`;
                });
                colgroup += '</colgroup>';

                const printStyles = `
                  @page { size: A4; margin: 1in; }
                  body { font-family: Arial, sans-serif; }
                  table { width: 100%; border-collapse: collapse; table-layout: fixed; }
                  th, td { border: 1px solid #ddd; padding: 8px; text-align: left; word-break: break-word; }
                  th { background-color: #f2f2f2; }
                  .header { text-align: center; margin-bottom: 20px; }
                  .time { text-align: right; margin-top: 10px; font-size: 0.8em; color: #555; }
                  .header-image { width: 100%; margin: 0 0 20px 0; }
                  .header-image img { max-width: 100%; height: auto; display: block; margin: 0 auto; }
                `;

                printWindow.document.write(`<html><head><title>${finalTitle}</title><style>${printStyles}</style></head><body>`);
                if (pdfConfig.headerImage) {
                  printWindow.document.write(`<div class="header-image"><img src="${pdfConfig.headerImage}" /></div>`);
                }
                printWindow.document.write(`<div class="header"><h1>${finalTitle}</h1></div>`);
                if (pdfConfig.showTimestamp) {
                  printWindow.document.write(`<div class="time"><p>Export Time: ${eventTime}</p></div>`);
                }
                printWindow.document.write(`<table>${colgroup}<thead><tr>`);
                printWindow.document.write('<th>S.No.</th>');
                headersToExport.forEach(h => printWindow.document.write(`<th>${h}</th>`));
                printWindow.document.write('</tr></thead><tbody>');
                rowsToExport.forEach((row, index) => {
                  printWindow.document.write('<tr>');
                  printWindow.document.write(`<td>${index + 1}</td>`);
                  headersToExport.forEach(h => printWindow.document.write(`<td>${row[h] || ''}</td>`));
                  printWindow.document.write('</tr>');
                });
                printWindow.document.write('</tbody></table>');
                printWindow.document.write('<script>window.onload=function(){window.print();setTimeout(function(){window.close()},100)}</script>');
                printWindow.document.write('</body></html>');
                printWindow.document.close();
            },
            onCancel: () => setWidthsPrompt({ isOpen: false })
        });
      },
      onCancel: () => setPrompt({ isOpen: false })
    });
  };

  const handleMessagingSend = (column, subject, message) => {
    const selectedData = sheetData.filter(row => selectedRows.has(row.id));
    const type = messagingModal.type;

    const generatedMessages = selectedData.map(row => {
      const recipient = row[column];
      const personalizedMessage = message.replace(/{{(.*?)}}/g, (match, p1) => {
        return row[p1.trim()] || '';
      });
      return { recipient, subject, message: personalizedMessage };
    });

    if (type === 'email') {
      handleSendEmails(generatedMessages);
    } else if (type === 'whatsapp') {
      if (generatedMessages.length > 5) {
        setAlert({ isOpen: true, title: 'Warning', message: 'Opening more than 5 WhatsApp tabs at once is not recommended.' });
      }
      generatedMessages.forEach(m => {
        window.open(`https://wa.me/${m.recipient}?text=${encodeURIComponent(m.message)}`, '_blank');
      });
    }

    setMessagingModal({ isOpen: false, type: null });
  };

  const handleEdit = (row) => {
    setEditingRowId(row.id);
    setEditedRowData({ ...row });
  };

  const handleSave = (id) => {
    setSheetData(prev => prev.map(row => (row.id === id ? editedRowData : row)));
    setEditingRowId(null);
    setEditedRowData(null);
    setAlert({ isOpen: true, title: 'Success', message: 'Changes saved successfully.' });
  };
  
  const handleCancelEdit = () => {
    setEditingRowId(null);
    setEditedRowData(null);
  };

  const handleEditChange = (e, key) => {
    setEditedRowData({ ...editedRowData, [key]: e.target.value });
  };

  const toggleRowSelection = (id) => {
    const newSet = new Set(selectedRows);
    if (newSet.has(id)) newSet.delete(id); 
    else newSet.add(id);
    setSelectedRows(newSet);
  };

  const toggleSelectAll = () => {
    if (selectedRows.size === paginatedData.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(paginatedData.map(row => row.id)));
    }
  };

  const toggleRowHighlight = (id) => {
    const newSet = new Set(highlightedRows);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setHighlightedRows(newSet);
  };

  const clearFilters = () => {
    setFilters({});
    setGlobalSearch('');
  };

  // New handler functions
  const handleAddTeamMember = (email, role) => {
    if (teamMembers.some(member => member.email === email)) {
      setAlert({ isOpen: true, title: 'Notice', message: 'This email is already in the team.' });
      return;
    }
    setTeamMembers([...teamMembers, { email, role }]);
    setAlert({ isOpen: true, title: 'Success', message: `Added ${email} as ${role}.` });
  };

  const handleDeleteSelectedRows = () => {
    if (selectedRows.size === 0) {
      setAlert({ isOpen: true, title: 'Notice', message: 'No rows selected for deletion.' });
      return;
    }
    setConfirmation({
      isOpen: true,
      title: 'Delete Selected Rows',
      message: `Are you sure you want to delete ${selectedRows.size} selected row(s)? This action cannot be undone.`,
      onConfirm: () => {
        setSheetData(prev => prev.filter(row => !selectedRows.has(row.id)));
        setSelectedRows(new Set()); // Clear selection after deletion
        setConfirmation({ isOpen: false });
        setAlert({ isOpen: true, title: 'Success', message: `${selectedRows.size} row(s) deleted successfully.` });
      },
      onCancel: () => setConfirmation({ isOpen: false })
    });
  };

  const handleRemoveTeamMember = (email) => {
    setTeamMembers(teamMembers.filter(member => member.email !== email));
    setAlert({ isOpen: true, title: 'Success', message: `Removed ${email} from team.` });
  };

  const handleGenerateShareLink = () => {
    const link = `${window.location.origin}${window.location.pathname}?shared=true`;
    setShareLink(link);
    navigator.clipboard.writeText(link);
    setAlert({ isOpen: true, title: 'Success', message: 'Share link copied to clipboard!' });
  };

  const handleSavePdfConfig = (config) => {
    setPdfConfig(config);
    setPdfConfigModalOpen(false);
    setAlert({ isOpen: true, title: 'Success', message: 'PDF configuration saved.' });
  };

  const handleSaveColumnAliases = (newAliases) => {
    setColumnAliases(newAliases);
    localStorage.setItem(`columnAliases_${activeSheetId}`, JSON.stringify(newAliases));
    setAliasModalOpen(false);
    setAlert({ isOpen: true, title: 'Success', message: 'Column names updated.' });
  };

  const handleSendEmails = (messages) => {
    if (!messages || messages.length === 0) {
      setAlert({ isOpen: true, title: 'Notice', message: 'No messages to prepare.' });
      return;
    }

    let preparedCount = 0;
    messages.forEach(msg => {
      const subject = encodeURIComponent(msg.subject || '');
      const body = encodeURIComponent(msg.message || '');
      const mailtoLink = `mailto:${msg.recipient}?subject=${subject}&body=${body}`;
      window.open(mailtoLink, '_blank');
      preparedCount++;
    });

    if (preparedCount > 0) {
      setAlert({
        isOpen: true,
        title: 'Success',
        message: `Prepared ${preparedCount} email(s) in your default mail application. Please send them manually.`,
      });
    } else {
      setAlert({ isOpen: true, title: 'Notice', message: 'No emails were prepared.' });
    }
  };

  const handleSaveSelection = (selectionName) => {
    if (!selectionName.trim()) {
      setAlert({ isOpen: true, title: 'Error', message: 'Selection name cannot be empty.' });
      return;
    }
    if (selectedRows.size === 0) {
      setAlert({ isOpen: true, title: 'Notice', message: 'No rows selected to save.' });
      return;
    }

    const selectedRowsData = sheetData.filter(row => selectedRows.has(row.id));
    const newSavedSelections = savedSelections.filter(s => s.name !== selectionName);
    setSavedSelections([...newSavedSelections, { name: selectionName, ids: Array.from(selectedRows), data: selectedRowsData }]);
    setIsSaveSelectionModalOpen(false);
    setAlert({ isOpen: true, title: 'Success', message: `Selection "${selectionName}" saved.` });
  };

  const handleLoadSelection = (ids) => {
    setSelectedRows(new Set(ids));
    setIsManageSelectionsModalOpen(false);
    setAlert({ isOpen: true, title: 'Success', message: 'Selection loaded successfully.' });
  };

  const handleDeleteSavedSelection = (nameToDelete) => {
    setConfirmation({
      isOpen: true,
      title: 'Delete Saved Selection',
      message: `Are you sure you want to delete the selection "${nameToDelete}"?`,
      onConfirm: () => {
        setSavedSelections(prev => prev.filter(s => s.name !== nameToDelete));
        setConfirmation({ isOpen: false });
        setAlert({ isOpen: true, title: 'Success', message: `Selection "${nameToDelete}" deleted.` });
      },
      onCancel: () => setConfirmation({ isOpen: false })
    });
  };

  const handleRenameSavedSelection = (oldName, newName) => {
    if (!newName.trim()) {
      setAlert({ isOpen: true, title: 'Error', message: 'New name cannot be empty.' });
      return;
    }
    if (savedSelections.some(s => s.name === newName)) {
      setAlert({ isOpen: true, title: 'Error', message: `Selection with name "${newName}" already exists.` });
      return;
    }
    setSavedSelections(prev => prev.map(s => s.name === oldName ? { ...s, name: newName } : s));
    setAlert({ isOpen: true, title: 'Success', message: `Selection renamed to "${newName}".` });
    setPrompt({ isOpen: false }); // Close the prompt modal
  };

  // --- JSX ---
  if (!isLoggedIn) {
    return (
      <div className="login-container">
        <div className="login-background" style={{backgroundImage: `url(https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=2070&auto=format&fit=crop)`}}></div>
        <div className="login-form-container">
          <div className="login-form">
            <div className="login-header">
              <h2>PLANBOT-ADMIN PANEL</h2>
              {/* Add a full-width logo image below or above the emoji */}
              {/* Replace '/logo.png' with your actual logo path */}
              <img src="/icon.png" alt="Event Manager Logo" style={{ width: '100%', height: '50%', marginBottom: '-3rem', marginTop: '-3rem', maxWidth: '300px' }} />
              <div className="logo">📊 Event Manager</div>
            </div>
            <form onSubmit={handleLogin}>
              {error && <div className="error-message">{error}</div>}
              <div className="form-group">
                <label>Username</label>
                <input type="text" className="form-input" value={username} onChange={(e) => setUsername(e.target.value)} required placeholder="Enter username" />
              </div>
              <div className="form-group">
                <label>Password</label>
                <input type="password" className="form-input" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="Enter password" />
              </div>
              <button type="submit" className="btn btn-primary login-btn">Login</button>
              
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`admin-panel-page ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <ConfirmationModal {...confirmation} />
      <AlertModal {...alert} onClose={() => setAlert({ isOpen: false })} />
      <PromptModal 
        isOpen={isSaveSelectionModalOpen}
        title="Save Current Selection"
        message="Enter a name for this selection:"
        onConfirm={handleSaveSelection}
        onCancel={() => setIsSaveSelectionModalOpen(false)}
      />
      <ColumnWidthsPromptModal
        isOpen={widthsPrompt.isOpen}
        title="Set PDF Column Widths"
        headers={widthsPrompt.headers}
        onConfirm={widthsPrompt.onConfirm}
        onCancel={widthsPrompt.onCancel}
      />
      <MessagingModal
        isOpen={messagingModal.isOpen}
        title={`Send ${messagingModal.type}`}
        headers={headers}
        onSend={handleMessagingSend}
        onCancel={() => setMessagingModal({ isOpen: false, type: null })}
        type={messagingModal.type}
      />
      <ColumnSelectorModal
        isOpen={columnSelector.isOpen}
        title={columnSelector.title}
        headers={headers}
        onConfirm={columnSelector.onConfirm}
        onCancel={columnSelector.onCancel}
      />
      <ColumnAliasModal
        isOpen={aliasModalOpen}
        headers={originalHeaders}
        aliases={columnAliases}
        onConfirm={handleSaveColumnAliases}
        onCancel={() => setAliasModalOpen(false)}
      />
      
      <TeamManagementModal
        isOpen={teamModalOpen}
        onClose={() => setTeamModalOpen(false)}
        teamMembers={teamMembers}
        onAddMember={handleAddTeamMember}
        onRemoveMember={handleRemoveTeamMember}
        onShareLink={handleGenerateShareLink}
      />
      
      <PdfConfigModal
        isOpen={pdfConfigModalOpen}
        onClose={() => setPdfConfigModalOpen(false)}
        onSave={handleSavePdfConfig}
        currentConfig={pdfConfig}
      />

      {!isSidebarCollapsed && (
        <aside className="admin-sidebar">
          {showSheetSelector ? (
            <SheetSelector
              sheets={sheets}
              activeSheet={activeSheetId}
              onSelectSheet={setActiveSheetId}
              onAddSheet={addNewSheet}
              onDeleteSheet={deleteSheet}
              onBack={() => setShowSheetSelector(false)}
            />
          ) : (
            <>
              <div className="sidebar-header">
                <span className="sidebar-logo">📊</span>
                <span className="sidebar-title">PLANBOT Admin</span>
                <button className="back-btn" onClick={() => setIsSidebarCollapsed(true)} title="Collapse Sidebar">
                  <MenuIcon />
                </button>
              </div>
              
              <div className="user-info">
                <span className="user-name">Welcome, {username}</span>
                <span className="user-role">({userRole})</span>
              </div>
              
              <div className="sidebar-content">
                <div className="sidebar-section">
                  <div className="current-sheet-info">
                    <span className="sheet-name">{sheets.find(s => s.id === activeSheetId)?.name || 'No Sheet Selected'}</span>
                    <button onClick={fetchSheetData} className="btn btn-primary refresh-btn" disabled={loading || !activeSheetId} title="Refresh data">
                      {loading ? '⏳' : '🔄'}
                    </button>
                  </div>
                  <button className="btn btn-secondary" onClick={() => setShowSheetSelector(true)} style={{width: '100%', marginTop: '10px'}}>
                    Manage Sheets
                  </button>
                </div>

                <div className="sidebar-section">
                  <h3>Global Search</h3>
                  <input type="text" placeholder="Search all columns..." className="form-input" value={globalSearch} onChange={(e) => setGlobalSearch(e.target.value)} />
                  <button className="btn btn-secondary clear-btn" onClick={clearFilters}>Clear Filters & Search</button>
                </div>

                <div className="sidebar-section">
                  <h3>Data Actions</h3>
                  
                  <button className="btn btn-secondary sidebar-action-btn" onClick={() => setIsModalOpen(true)} disabled={selectedRows.size === 0}>
                    👁️ Preview Selected ({selectedRows.size})
                  </button>
                  <button className="btn btn-secondary sidebar-action-btn" onClick={() => exportToCsv('all_data.csv', sortedData)} disabled={sheetData.length === 0}>
                    📥 Download All as CSV
                  </button>
                  <button className="btn btn-secondary sidebar-action-btn" onClick={() => {
                    const rows = sheetData.filter(row => selectedRows.has(row.id));
                    if (rows.length === 0) {
                      setAlert({ isOpen: true, title: 'Notice', message: 'There are no selected rows to export.' });
                      return;
                    }
                    setColumnSelector({
                      isOpen: true,
                      title: 'Select Columns for CSV Export',
                      onConfirm: (selectedColumns) => {
                        exportToCsv('selected_data.csv', rows, selectedColumns);
                        setColumnSelector({ isOpen: false, title: '', onConfirm: () => {}, onCancel: () => {} });
                      },
                      onCancel: () => setColumnSelector({ isOpen: false, title: '', onConfirm: () => {}, onCancel: () => {} })
                    });
                  }} disabled={selectedRows.size === 0}>
                    📥 Download Selected as CSV
                  </button>
                  <button className="btn btn-secondary sidebar-action-btn" onClick={() => handlePdfExport(true, null)} disabled={sheetData.length === 0}>
                    📄 Export All to PDF
                  </button>
                  <button className="btn btn-secondary sidebar-action-btn" onClick={() => {
                    const rows = sheetData.filter(row => selectedRows.has(row.id));
                    if (rows.length === 0) {
                      setAlert({ isOpen: true, title: 'Notice', message: 'There are no selected rows to export.' });
                      return;
                    }
                    setColumnSelector({
                      isOpen: true,
                      title: 'Select Columns for PDF Export',
                      onConfirm: (selectedColumns) => {
                        handlePdfExport(false, selectedColumns);
                        setColumnSelector({ isOpen: false, title: '', onConfirm: () => {}, onCancel: () => {} });
                      },
                      onCancel: () => setColumnSelector({ isOpen: false, title: '', onConfirm: () => {}, onCancel: () => {} })
                    });
                  }} disabled={selectedRows.size === 0}>
                    📄 Export Selected to PDF
                  </button>
                  <button className="btn btn-secondary sidebar-action-btn" onClick={() => setPdfConfigModalOpen(true)}>
                    ⚙️ Configure PDF Export
                  </button>
                  <a href={`https://docs.google.com/spreadsheets/d/${activeSheetId}/export?format=csv`} target="_blank" rel="noopener noreferrer" className={`btn btn-secondary sidebar-action-btn ${!activeSheetId ? 'disabled' : ''}`}>
                    🔗 Download Google Sheet
                  </a>
                </div>

                <div className="sidebar-section">
                  <h3>Messaging</h3>
                  <button className="btn btn-secondary sidebar-action-btn" onClick={() => setMessagingModal({ isOpen: true, type: 'email' })} disabled={selectedRows.size === 0}>
                    📧 Send Email to Selected
                  </button>
                  <button className="btn btn-secondary sidebar-action-btn" onClick={() => setMessagingModal({ isOpen: true, type: 'whatsapp' })} disabled={selectedRows.size === 0}>
                    💬 Send WhatsApp to Selected
                  </button>
                </div>

                <div className="sidebar-section">
                  <h3>Team Collaboration</h3>
                  <button className="btn btn-secondary sidebar-action-btn" onClick={() => setTeamModalOpen(true)}>
                    👥 Manage Team ({teamMembers.length})
                  </button>
                  {shareLink && (
                    <div className="share-link-info">
                      <p>Share link: <span className="truncate">{shareLink}</span></p>
                    </div>
                  )}
                </div>

                <div className="sidebar-section">
                  <h3>Settings</h3>
                  <div className="theme-toggle">
                    <span>Light</span>
                    <label className="switch">
                      <input type="checkbox" onChange={() => setTheme(t => t === 'light' ? 'dark' : 'light')} checked={theme === 'dark'} />
                      <span className="slider"></span>
                    </label>
                    <span>Dark</span>
                  </div>
                  <label>Rows Per Page</label>
                  <select value={rowsPerPage} onChange={e => setRowsPerPage(Number(e.target.value))} className="form-input">
                    {[10, 20, 50, 100].map(size => <option key={size} value={size}>{size}</option>)}
                  </select>
                  <button onClick={handleLogout} className="btn btn-secondary logout-btn" style={{width: '100%', marginTop: '1rem'}}>Logout</button>
                </div>
              </div>
            </>
          )}
        </aside>
      )}

      <main className="admin-main-content">
        <div className="admin-main-header">
          <button className="back-btn" onClick={() => setIsSidebarCollapsed(prev => !prev)} title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}>
            <MenuIcon />
          </button>
          <h1>{sheets.find(s => s.id === activeSheetId)?.name || 'Sheet Data'}</h1>
          {sheetData.length > 0 && (
            <span>Showing {paginatedData.length} of {filteredData.length} matching rows ({sheetData.length} total)</span>
          )}
        </div>

        {error && <div className="error-message">{error}</div>}
        {loading && <div className="loading-overlay"><div className="loading-spinner"></div><p>Loading data...</p></div>}

        {!loading && sheetData.length > 0 ? (
          <div className="table-container">
            <div className="table-controls">
              <p>Total selected: {selectedRows.size}</p>
              <div className="table-controls-right">
                {originalHeaders.length > headers.length && (
                    <button className="btn btn-secondary" onClick={handleRestoreColumns}>
                        Restore Columns
                    </button>
                )}
                <button className="btn btn-secondary" onClick={() => setAliasModalOpen(true)}>
                  Edit Column Names
                </button>
                <button className="btn btn-secondary" onClick={() => setManageColumnsMode(prev => !prev)}>
                  {manageColumnsMode ? 'Done' : 'Manage Columns'}
                </button>
                <button 
                  className="btn btn-secondary" 
                  onClick={() => setIsSaveSelectionModalOpen(true)}
                  disabled={selectedRows.size === 0}
                >
                  💾 Save Current Selection
                </button>
                <button 
                  className="btn btn-secondary" 
                  onClick={() => setIsManageSelectionsModalOpen(true)}
                >
                  🗃️ Manage Saved Selections
                </button>
                <button className="btn btn-secondary" onClick={toggleSelectAll} disabled={paginatedData.length === 0}>
                  {selectedRows.size === paginatedData.length ? 'Deselect Page' : 'Select Page'}
                </button>
                <button className="btn btn-secondary" onClick={() => setHighlightedRows(new Set())} disabled={highlightedRows.size === 0}>
                  Clear Highlights
                </button>
              </div>
            </div>

            <div className="table-scroll-container">
              <table className="data-table" style={{tableLayout: 'fixed', width: '100%'}}>
                <thead>
                  <tr>
                    <th className="checkbox-column" style={{width: '50px'}}>
                      <input type="checkbox" onChange={toggleSelectAll} checked={paginatedData.length > 0 && selectedRows.size >= paginatedData.length} />
                    </th>
                    <th className="actions-column" style={{width: '120px'}}>Actions</th>
                    {headers.map(h => (
                      <th 
                        key={h} 
                        style={{width: columnWidths[h], position: 'relative'}}
                      >
                        <div className="column-header" style={{display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%'}}>
                          <div 
                            style={{display: 'flex', alignItems: 'center', cursor: 'pointer', flexGrow: 1}} 
                            onClick={(e) => { e.stopPropagation(); setSortConfig(sc => ({ key: h, direction: sc.key === h && sc.direction === 'ascending' ? 'descending' : 'ascending' }))}}>
                            <span className="column-title">{columnAliases[h] || h}</span>
                            <span style={{marginLeft: 'auto'}}>
                              {sortConfig.key === h && (sortConfig.direction === 'ascending' ? '▲' : '▼')}
                            </span>
                             {manageColumnsMode && (
                              <button
                                title={`Hide ${h} column`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteColumn(h);
                                }}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'red', fontWeight: 'bold', marginLeft: '5px'}}
                              >
                                &times;
                              </button>
                            )}
                          </div>
                          <input 
                            type="text" 
                            className="filter-input" 
                            placeholder={`Filter...`} 
                            value={filters[h] || ''} 
                            onChange={e => setFilters({ ...filters, [h]: e.target.value })}
                            onClick={e => e.stopPropagation()}
                            style={{width: 'calc(100% - 4px)', boxSizing: 'border-box'}}
                          />
                        </div>
                        <div
                          onMouseDown={(e) => handleResizeStart(h, e)}
                          style={{
                            position: 'absolute',
                            right: 0,
                            top: 0,
                            height: '100%',
                            width: '5px',
                            cursor: 'col-resize',
                            userSelect: 'none',
                          }}
                        />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.map(row => (
                    <tr key={row.id} className={`${selectedRows.has(row.id) ? 'selected' : ''} ${highlightedRows.has(row.id) ? 'highlighted' : ''} ${editingRowId === row.id ? 'editing' : ''}`}>
                      <td className="checkbox-column">
                        <input type="checkbox" checked={selectedRows.has(row.id)} onChange={() => toggleRowSelection(row.id)} />
                      </td>
                      <td className="actions-column">
                        {editingRowId === row.id ? (
                          <>
                            <button className="action-btn save-btn" title="Save" onClick={() => handleSave(row.id)}><span className="icon-save"></span></button>
                            <button className="action-btn cancel-btn" title="Cancel" onClick={handleCancelEdit}><span className="icon-cancel"></span></button>
                          </>
                        ) : (
                          <>
                            <button className="action-btn highlight-btn" title="Highlight" onClick={() => toggleRowHighlight(row.id)}><span className="icon-highlight"></span></button>
                            <button className="action-btn edit-btn" title="Edit" onClick={() => handleEdit(row)}><span className="icon-edit"></span></button>
                            <button className="action-btn delete-btn" title="Delete" onClick={() => handleDeleteRow(row.id)}><span className="icon-delete"></span></button>
                          </>
                        )}
                      </td>
                      {headers.map(h => (
                        <td key={h}>
                          {editingRowId === row.id ? (
                            <input type="text" className='edit-input' value={editedRowData[h]} onChange={(e) => handleEditChange(e, h)} />
                          ) : (
                            <CellContent content={row[h]} />
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="pagination-controls">
              <div className="pagination-info">
                <span>Page {currentPage} of {Math.ceil(sortedData.length / rowsPerPage) || 1}</span>
              </div>
              <div className="pagination-buttons">
                <button className="btn btn-secondary" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>Previous</button>
                <button className="btn btn-secondary" onClick={() => setCurrentPage(p => Math.min(p + 1, Math.ceil(sortedData.length / rowsPerPage) || 1))} disabled={currentPage * rowsPerPage >= sortedData.length}>Next</button>
              </div>
            </div>
          </div>
        ) : (
          !loading && <div className="empty-state">
            <div className="empty-icon">📊</div>
            <h3>No sheet selected</h3>
            <p>Please add or select a Google Sheet from the sidebar to get started.</p>
            <button className="btn btn-primary" onClick={() => setShowSheetSelector(true)}>
              Manage Sheets
            </button>
          </div>
        )}
      </main>

      {isModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Selected Rows Preview ({selectedRows.size})</h2>
              <button onClick={() => setIsModalOpen(false)} className="modal-close-btn">&times;</button>
            </div>
            <div className="modal-body">
              <div className="modal-table-container">
                <table className="data-table modal-table">
                  <thead>
                    <tr>
                      {headers.map(h => <th key={h}>{columnAliases[h] || h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {sheetData.filter(row => selectedRows.has(row.id)).map(row => (
                      <tr key={row.id}>
                        {headers.map(h => <td key={h}>{String(row[h])}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Close</button>
              <button className="btn btn-primary" onClick={() => exportToCsv('selected_data.csv', sheetData.filter(row => selectedRows.has(row.id)))}>
                Download Selection as CSV
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;