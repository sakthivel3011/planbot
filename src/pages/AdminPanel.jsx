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
const ConfirmationModal = ({ isOpen, title, message, onConfirm, onCancel, confirmText, confirmButtonClass }) => {
  if (!isOpen) return null;
  return (
    <div className="confirm-modal-backdrop">
      <div className="confirm-modal">
        <h3>{title}</h3>
        <div className="confirm-modal-message">
          {typeof message === 'string' && message.split('\n').map((line, i) => <p key={i}>{line}</p>)}
        </div>
        <div className="confirm-modal-actions">
          <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
          <button className={`btn ${confirmButtonClass || 'btn-danger'}`} onClick={onConfirm}>{confirmText || 'Delete'}</button>
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
  // Improved URL regex to handle more URL patterns including Google Drive links
  const urlRegex = /^(https?:\/\/[^\s]+)$/i;
  
  if (typeof content === 'string' && content.trim()) {
    const trimmedContent = content.trim();
    
    // Check if it's a URL
    if (urlRegex.test(trimmedContent)) {
      return (
        <a 
          href={trimmedContent} 
          target="_blank" 
          rel="noopener noreferrer"
          style={{
            color: '#007bff',
            textDecoration: 'underline',
            cursor: 'pointer',
            wordBreak: 'break-all'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {trimmedContent.length > 50 ? `${trimmedContent.substring(0, 50)}...` : trimmedContent}
        </a>
      );
    }
  }
  
  return String(content || '');
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
            <span className="sheet-icon" onClick={(e) => { e.stopPropagation(); onSelectSheet(sheet.id); }}>📊</span>
            <span className="sheet-name" onClick={(e) => { e.stopPropagation(); onSelectSheet(sheet.id); }}>{sheet.name}</span>
            <button className="action-btn delete-btn" title="Delete Sheet" onClick={(e) => { e.stopPropagation(); onDeleteSheet(sheet.id); }}>
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
                  <span className="member-email">{member.email}</span>
                  <span className="member-role">{member.role}</span>
                  <button
                    className="action-btn delete-btn"
                    onClick={() => onRemoveMember(member.email)}
                    title="Remove member"
                  >
                    <span className="icon-delete"></span>
                  </button>
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

// Save Selected Rows Modal
const SaveSelectedRowsModal = ({ isOpen, onClose, onSave, selectedRowsCount }) => {
  const [name, setName] = useState('');

  useEffect(() => {
    if (isOpen) {
      setName('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal-content">
        <div className="modal-header">
          <h2>💾 Save Selected Team ({selectedRowsCount} members)</h2>
          <button onClick={onClose} className="modal-close-btn">&times;</button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label>Team Name *</label>
            <input
              type="text"
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter a name for this team (e.g., 'Tech Team', 'Marketing Group', 'Event Committee')"
              style={{fontSize: '1rem', padding: '12px'}}
            />
          </div>
          <div style={{backgroundColor: '#e8f5e8', padding: '12px', borderRadius: '6px', marginTop: '10px'}}>
            <p style={{margin: '0', fontSize: '0.9rem', color: '#2d5a2d'}}>
              <strong>💡 This will save:</strong><br/>
              • All {selectedRowsCount} currently selected members<br/>
              • Their complete data and information<br/>
              • Quick access from sidebar for future use
            </p>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button 
            className="btn btn-primary" 
            onClick={() => {
              onSave(name);
              onClose();
            }}
            disabled={!name.trim()}
            style={{backgroundColor: name.trim() ? '#28a745' : '', borderColor: name.trim() ? '#28a745' : ''}}
          >
            💾 Save Team Selection
          </button>
        </div>
      </div>
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
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [highlightedRows, setHighlightedRows] = useState(new Set());
  const [isModalOpen, setIsModalOpen] = useState(false);
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
  const [saveSelectionModalOpen, setSaveSelectionModalOpen] = useState(false);
  const [showOnlySelected, setShowOnlySelected] = useState(false);
  
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
  const [savedSelections, setSavedSelections] = useState(() => {
    const saved = localStorage.getItem('savedSelections');
    return saved ? JSON.parse(saved) : [];
  });
  const [userRole, setUserRole] = useState('admin'); // admin, editor, viewer
  const [shareLink, setShareLink] = useState('');

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
      // Try direct Google Sheets export URL first
      let response;
      let csvData;
      
      try {
        // Method 1: Direct export URL (works if sheet is public)
        response = await fetch(`https://docs.google.com/spreadsheets/d/${activeSheetId}/export?format=csv&gid=0`);
        if (response.ok) {
          csvData = await response.text();
        }
      } catch (directError) {
        console.log('Direct export failed, trying alternative method...');
      }
      
      // Method 2: If direct fails, try with CORS proxy
      if (!csvData) {
        try {
          response = await fetch(`https://corsproxy.io/?${encodeURIComponent(`https://docs.google.com/spreadsheets/d/${activeSheetId}/export?format=csv&gid=0`)}`);
          if (response.ok) {
            csvData = await response.text();
          }
        } catch (proxyError) {
          console.log('CORS proxy failed, trying gviz method...');
        }
      }
      
      // Method 3: Fallback to gviz method
      if (!csvData) {
        response = await fetch(`https://docs.google.com/spreadsheets/d/${activeSheetId}/gviz/tq?tqx=out:csv&gid=0`);
        if (!response.ok) throw new Error('Failed to fetch data. Make sure the sheet is public and the URL is correct.');
        csvData = await response.text();
      }
      
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

    // Filter out empty rows (rows where all values are empty, null, or just whitespace)
    result = result.filter(row => {
      return headers.some(header => {
        const value = row[header];
        return value !== null && value !== undefined && String(value).trim() !== '';
      });
    });

    if (showOnlySelected) {
      const selectedRowData = result.filter(row => selectedRows.has(row.id));
      // When showing only selected, we don't want to apply other filters,
      // but we should respect the sort order.
      return selectedRowData;
    }

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
  }, [sheetData, filters, globalSearch, headers, showOnlySelected, selectedRows]);

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
    if (username === 'sakthi' && password === 'cmc@kongu') {
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
    const aliasedHeadersToExport = headersToExport.map(h => columnAliases[h] || h);
    const allHeadersForWidths = ['S.No.', ...aliasedHeadersToExport];

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
                aliasedHeadersToExport.forEach(h => printWindow.document.write(`<th>${h}</th>`));
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

  const handleSaveSelection = (name) => {
    const selectedData = sheetData.filter(row => selectedRows.has(row.id));
    const newSelection = {
      id: Date.now().toString(),
      name,
      date: new Date().toLocaleString(),
      count: selectedData.length,
      data: selectedData,
      sheetId: activeSheetId // Store which sheet this selection belongs to
    };
    
    setSavedSelections(prev => [...prev, newSelection]);
    setAlert({ isOpen: true, title: 'Success', message: `Team "${name}" saved with ${selectedData.length} members!` });
  };

  const handleLoadSelection = (selection) => {
    // Filter the selection data to only include rows that exist in current sheet
    const currentSheetRowIds = new Set(sheetData.map(row => row.id));
    const validRowIds = selection.data
      .filter(row => currentSheetRowIds.has(row.id))
      .map(row => row.id);
    
    setSelectedRows(new Set(validRowIds));
    
    if (validRowIds.length === selection.count) {
      setAlert({ 
        isOpen: true, 
        title: 'Team Loaded', 
        message: `Successfully loaded "${selection.name}" with ${validRowIds.length} members!` 
      });
    } else {
      setAlert({ 
        isOpen: true, 
        title: 'Partial Load', 
        message: `Loaded "${selection.name}": ${validRowIds.length}/${selection.count} members found in current sheet.` 
      });
    }
  };

  const handleDeleteSelection = (selectionId) => {
    const selection = savedSelections.find(s => s.id === selectionId);
    if (selection) {
      setSavedSelections(prev => prev.filter(s => s.id !== selectionId));
      setAlert({ 
        isOpen: true, 
        title: 'Deleted', 
        message: `Team "${selection.name}" has been deleted.` 
      });
    }
  };

  // --- JSX ---
  if (!isLoggedIn) {
    return (
      <div className="modern-login-container">
        <div className="login-left-section">
          <div className="login-left-content">
            <div className="brand-section">
              <img src="/icon.png" alt="PLANBOT Logo" className="brand-logo" />
              <h1 className="brand-title">PLANBOT</h1>
              <p className="brand-subtitle">Advanced Event Management System</p>
            </div>
            <div className="features-showcase">
              <div className="feature-item">
                <div className="feature-icon">📊</div>
                <div className="feature-text">
                  <h3>Data Analytics</h3>
                  <p>Comprehensive event data management and insights</p>
                </div>
              </div>
              <div className="feature-item">
                <div className="feature-icon">👥</div>
                <div className="feature-text">
                  <h3>Team Collaboration</h3>
                  <p>Work together seamlessly with your team</p>
                </div>
              </div>
              <div className="feature-item">
                <div className="feature-icon">🚀</div>
                <div className="feature-text">
                  <h3>Fast & Efficient</h3>
                  <p>Streamlined workflows for maximum productivity</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="login-right-section">
          <div className="login-form-wrapper">
            <div className="login-form-header">
              <h2>Welcome Back</h2>
              <p>Sign in to access your admin panel</p>
            </div>
            
            <form onSubmit={handleLogin} className="modern-login-form">
              {error && <div className="error-message modern-error">{error}</div>}
              
              <div className="form-group modern-form-group">
                <label className="modern-label">Username</label>
                <div className="input-wrapper">
                  <span className="input-icon">👤</span>
                  <input 
                    type="text" 
                    className="modern-input" 
                    value={username} 
                    onChange={(e) => setUsername(e.target.value)} 
                    required 
                    placeholder="Enter your username" 
                  />
                </div>
              </div>
              
              <div className="form-group modern-form-group">
                <label className="modern-label">Password</label>
                <div className="input-wrapper">
                  <span className="input-icon">🔒</span>
                  <input 
                    type="password" 
                    className="modern-input" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    required 
                    placeholder="Enter your password" 
                  />
                </div>
              </div>
              
              <button type="submit" className="modern-login-btn">
                <span className="btn-text">Sign In</span>
                <span className="btn-icon">→</span>
              </button>
            </form>
            
            <div className="login-footer">
              <p>© 2025 PLANBOT. All rights reserved.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`admin-panel-page ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <ConfirmationModal {...confirmation} />
      <AlertModal {...alert} onClose={() => setAlert({ isOpen: false })} />
      <PromptModal {...prompt} />
      <ColumnWidthsPromptModal
        isOpen={widthsPrompt.isOpen}
        title="Set PDF Column Widths"
        headers={widthsPrompt.headers}
        onConfirm={widthsPrompt.onConfirm}
        onCancel={widthsPrompt.onCancel}
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

      <SaveSelectedRowsModal
        isOpen={saveSelectionModalOpen}
        onClose={() => setSaveSelectionModalOpen(false)}
        onSave={handleSaveSelection}
        selectedRowsCount={selectedRows.size}
      />

      {/* Floating sidebar toggle button when collapsed */}
      {isSidebarCollapsed && (
        <button
          className="floating-sidebar-toggle"
          onClick={(e) => { e.stopPropagation(); setIsSidebarCollapsed(false); }}
          title="Open Sidebar"
          style={{
            position: 'fixed',
            top: '20px',
            left: '20px',
            zIndex: 1001,
            padding: '12px',
            borderRadius: '50%',
            backgroundColor: 'var(--primary)',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(67, 97, 238, 0.4)',
            transition: 'all 0.3s ease',
            animation: 'pulse 2s infinite'
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'scale(1.1)';
            e.target.style.boxShadow = '0 6px 20px rgba(67, 97, 238, 0.6)';
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'scale(1)';
            e.target.style.boxShadow = '0 4px 12px rgba(67, 97, 238, 0.4)';
          }}
        >
          <MenuIcon />
        </button>
      )}

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
                <div className="sidebar-nav-controls">
                  <span className="sidebar-title">PLANBOT Admin</span>
                </div>
                <button 
                  className="back-btn sidebar-close-btn" 
                  onClick={(e) => { e.stopPropagation(); setIsSidebarCollapsed(true); }} 
                  title="Collapse Sidebar"
                  style={{
                    padding: '8px',
                    borderRadius: '6px',
                    backgroundColor: 'transparent',
                    border: '1px solid var(--border)',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = 'var(--danger)';
                    e.target.style.color = 'white';
                    e.target.style.transform = 'rotate(180deg)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = 'transparent';
                    e.target.style.color = 'var(--text-secondary)';
                    e.target.style.transform = 'rotate(0deg)';
                  }}
                >
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
                    <button onClick={(e) => { e.stopPropagation(); fetchSheetData(); }} className="btn btn-primary refresh-btn" disabled={loading || !activeSheetId} title="Refresh data">
                      {loading ? '⏳' : '🔄'}
                    </button>
                  </div>
                  <button className="btn btn-secondary" onClick={(e) => { e.stopPropagation(); setShowSheetSelector(true); }} style={{width: '100%', marginTop: '10px'}}>
                    Manage Sheets
                  </button>
                </div>

                <div className="sidebar-section">
                  <h3>Global Search</h3>
                  <input type="text" placeholder="Search all columns..." className="form-input" value={globalSearch} onChange={(e) => setGlobalSearch(e.target.value)} />
                  <button className="btn btn-secondary clear-btn" onClick={(e) => { e.stopPropagation(); clearFilters(); }}>Clear Filters & Search</button>
                </div>

                <div className="sidebar-section">
                  <h3>Data Actions</h3>
                  
                  <button className="btn btn-secondary sidebar-action-btn" onClick={() => setIsModalOpen(true)} disabled={selectedRows.size === 0}>
                    👁️ Preview Selected ({selectedRows.size})
                  </button>
                  <button className="btn btn-secondary sidebar-action-btn" onClick={() => setSaveSelectionModalOpen(true)} disabled={selectedRows.size === 0}>
                    💾 Save Selection ({selectedRows.size})
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
                </div>

                {/* Saved Selections Section */}
                <div className="sidebar-section">
                  <h3>📋 Saved Teams</h3>
                  {savedSelections.length === 0 ? (
                    <p style={{fontSize: '0.85rem', color: '#666', textAlign: 'center', padding: '10px', fontStyle: 'italic'}}>
                      No saved teams yet. Select members and click "Save Selection" to create teams.
                    </p>
                  ) : (
                    <div className="saved-selections-list">
                      {savedSelections.map((selection) => (
                        <div key={selection.id} className="saved-selection-item">
                          <div className="selection-info">
                            <div className="selection-name">{selection.name}</div>
                            <div className="selection-details">
                              {selection.count} members • {new Date(selection.date).toLocaleDateString()}
                            </div>
                          </div>
                          <div className="selection-actions">
                            <button 
                              className="btn btn-primary load-btn" 
                              onClick={(e) => { e.stopPropagation(); handleLoadSelection(selection); }}
                              title="Load this team selection"
                            >
                              📂
                            </button>
                            <button 
                              className="btn btn-secondary delete-btn" 
                              onClick={(e) => {
                                e.stopPropagation();
                                if (window.confirm(`Delete team "${selection.name}"?`)) {
                                  handleDeleteSelection(selection.id);
                                }
                              }}
                              title="Delete this saved team"
                            >
                              ×
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="sidebar-section">
                  <h3>Settings</h3>
                  <div className="theme-toggle">
                    <span>Light</span>
                    <label className="switch">
                      <input type="checkbox" onChange={(e) => { e.stopPropagation(); setTheme(t => t === 'light' ? 'dark' : 'light'); }} checked={theme === 'dark'} />
                      <span className="slider"></span>
                    </label>
                    <span>Dark</span>
                  </div>
                  <label>Rows Per Page</label>
                  <select value={rowsPerPage} onChange={(e) => { e.stopPropagation(); setRowsPerPage(Number(e.target.value)); }} className="form-input">
                    {[10, 20, 50, 100].map(size => <option key={size} value={size}>{size}</option>)}
                  </select>
                  <button onClick={(e) => { e.stopPropagation(); handleLogout(); }} className="btn btn-secondary logout-btn" style={{width: '100%', marginTop: '1rem'}}>Logout</button>
                </div>
              </div>
            </>
          )}
        </aside>
      )}

      <main className="admin-main-content">
        <div className="admin-main-header">
          <div style={{display: 'flex', alignItems: 'center', gap: '20px'}}>
            <h1 style={{margin: 0}}>{sheets.find(s => s.id === activeSheetId)?.name || 'Sheet Data'}</h1>
          </div>
          <div style={{display: 'flex', alignItems: 'center', gap: '15px'}}>
            {showOnlySelected && selectedRows.size > 0 && (
              <div style={{backgroundColor: '#28a745', color: 'white', padding: '5px 12px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 'bold'}}>
                👥 Viewing Selected Team Only ({selectedRows.size} members)
              </div>
            )}
            {sheetData.length > 0 && (
              <span>Showing {paginatedData.length} of {filteredData.length} matching rows ({sheetData.length} total)</span>
            )}
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}
        {loading && <div className="loading-overlay"><div className="loading-spinner"></div><p>Loading data...</p></div>}

        {!loading && sheetData.length > 0 ? (
          <div className="table-container">
            <div className="table-controls">
              <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                <p>Total selected: {selectedRows.size}</p>
                {selectedRows.size > 0 && (
                  <button 
                    className={`btn ${showOnlySelected ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => {
                      setShowOnlySelected(prev => !prev);
                      setCurrentPage(1); // Reset to first page when toggling
                    }}
                    style={{
                      backgroundColor: showOnlySelected ? '#28a745' : '',
                      color: showOnlySelected ? 'white' : '',
                      fontWeight: 'bold',
                      fontSize: '0.85rem'
                    }}
                  >
                    {showOnlySelected ? '👥 Showing Selected Only' : '👁️ Show Only Selected'}
                  </button>
                )}
              </div>
              <div className="table-controls-right">
                {showOnlySelected && selectedRows.size > 0 && (
                  <div style={{display: 'flex', gap: '5px', marginRight: '10px', padding: '5px', backgroundColor: '#e8f5e8', borderRadius: '6px', border: '2px solid #28a745'}}>
                    <small style={{color: '#155724', fontWeight: 'bold', alignSelf: 'center', marginRight: '5px'}}>Selected Team Actions:</small>
                    <button 
                      className="btn btn-primary" 
                      onClick={() => exportToCsv(`selected_team_${selectedRows.size}_members.csv`, sheetData.filter(row => selectedRows.has(row.id)))}
                      style={{fontSize: '0.75rem', padding: '4px 8px'}}
                    >
                      📥 Export Selected CSV
                    </button>
                    <button 
                      className="btn btn-primary" 
                      onClick={() => handlePdfExport(false, null)}
                      style={{fontSize: '0.75rem', padding: '4px 8px'}}
                    >
                      📄 Export Selected PDF
                    </button>
                    <button 
                      className="btn btn-danger" 
                      onClick={() => {
                        setConfirmation({
                          isOpen: true,
                          title: 'Delete Selected Members',
                          message: `Are you sure you want to delete all ${selectedRows.size} selected members? This action cannot be undone.`,
                          onConfirm: () => {
                            setSheetData(prev => prev.filter(row => !selectedRows.has(row.id)));
                            setSelectedRows(new Set());
                            setShowOnlySelected(false);
                            setConfirmation({ isOpen: false });
                            setAlert({ isOpen: true, title: 'Success', message: `Deleted ${selectedRows.size} selected members successfully.` });
                          },
                          onCancel: () => setConfirmation({ isOpen: false })
                        });
                      }}
                      style={{fontSize: '0.75rem', padding: '4px 8px'}}
                    >
                      🗑️ Delete Selected
                    </button>
                  </div>
                )}
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
                    <th className="checkbox-column" style={{width: '60px', textAlign: 'center'}}>
                      <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px'}}>
                        <input 
                          type="checkbox" 
                          onChange={toggleSelectAll} 
                          checked={paginatedData.length > 0 && selectedRows.size >= paginatedData.length}
                          style={{
                            width: '18px',
                            height: '18px',
                            cursor: 'pointer',
                            accentColor: '#007bff'
                          }}
                        />
                        <small style={{fontSize: '10px', color: '#666'}}>All</small>
                      </div>
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
                      <td className="checkbox-column" style={{textAlign: 'center'}}>
                        <input 
                          type="checkbox" 
                          checked={selectedRows.has(row.id)} 
                          onChange={() => toggleRowSelection(row.id)}
                          style={{
                            width: '16px',
                            height: '16px',
                            cursor: 'pointer',
                            accentColor: '#007bff'
                          }}
                        />
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
              <button className="btn btn-primary" onClick={() => setSaveSelectionModalOpen(true)}>
                Save Selection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;