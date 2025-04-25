import * as React from 'react';

interface EmailLayoutProps {
  children: React.ReactNode;
  previewText?: string;
}

export const EmailLayout: React.FC<EmailLayoutProps> = ({ 
  children,
  previewText = 'Message de DataCop'
}) => {
  return (
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta httpEquiv="Content-Type" content="text/html; charset=UTF-8" />
        <title>{previewText}</title>
        <style dangerouslySetInnerHTML={{ __html: `
          @media only screen and (max-width: 620px) {
            table.body h1 {
              font-size: 28px !important;
              margin-bottom: 10px !important;
            }
            
            table.body p,
            table.body ul,
            table.body ol,
            table.body td,
            table.body span,
            table.body a {
              font-size: 16px !important;
            }
            
            table.body .wrapper,
            table.body .article {
              padding: 10px !important;
            }
            
            table.body .content {
              padding: 0 !important;
            }
            
            table.body .container {
              padding: 0 !important;
              width: 100% !important;
            }
            
            table.body .main {
              border-left-width: 0 !important;
              border-radius: 0 !important;
              border-right-width: 0 !important;
            }
            
            table.body .btn table {
              width: 100% !important;
            }
            
            table.body .btn a {
              width: 100% !important;
            }
            
            table.body .img-responsive {
              height: auto !important;
              max-width: 100% !important;
              width: auto !important;
            }
          }
          
          @media all {
            .ExternalClass {
              width: 100%;
            }
            
            .ExternalClass,
            .ExternalClass p,
            .ExternalClass span,
            .ExternalClass font,
            .ExternalClass td,
            .ExternalClass div {
              line-height: 100%;
            }
            
            .apple-link a {
              color: inherit !important;
              font-family: inherit !important;
              font-size: inherit !important;
              font-weight: inherit !important;
              line-height: inherit !important;
              text-decoration: none !important;
            }
            
            #MessageViewBody a {
              color: inherit;
              text-decoration: none;
              font-size: inherit;
              font-family: inherit;
              font-weight: inherit;
              line-height: inherit;
            }
            
            .btn-primary table td:hover {
              background-color: #0056b3 !important;
            }
            
            .btn-primary a:hover {
              background-color: #0056b3 !important;
              border-color: #0056b3 !important;
            }
          }
        `}} />
      </head>
      <body style={{
        backgroundColor: '#f6f6f6',
        fontFamily: 'sans-serif',
        fontSize: '14px',
        lineHeight: '1.4',
        margin: 0,
        padding: 0,
        WebkitTextSizeAdjust: '100%',
        msTextSizeAdjust: '100%',
      }}>
        <span
          style={{
            color: 'transparent',
            display: 'none',
            height: 0,
            maxHeight: 0,
            maxWidth: 0,
            opacity: 0,
            overflow: 'hidden',
            msoHide: 'all',
            visibility: 'hidden',
            width: 0,
          }}
        >
          {previewText}
        </span>
        <table
          role="presentation"
          border={0}
          cellPadding="0"
          cellSpacing="0"
          className="body"
          style={{
            backgroundColor: '#f6f6f6',
            width: '100%',
          }}
        >
          <tr>
            <td>&nbsp;</td>
            <td
              style={{
                display: 'block',
                maxWidth: '580px',
                padding: '10px',
                width: '580px',
                margin: '0 auto',
              }}
            >
              <div
                style={{
                  boxSizing: 'border-box',
                  display: 'block',
                  margin: '0 auto',
                  maxWidth: '580px',
                  padding: '10px',
                }}
              >
                <table
                  role="presentation"
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '3px',
                    width: '100%',
                    boxShadow: '0 2px 5px rgba(0, 0, 0, 0.05)',
                  }}
                >
                  <tr>
                    <td
                      style={{
                        boxSizing: 'border-box',
                        padding: '20px',
                      }}
                    >
                      <table
                        role="presentation"
                        border={0}
                        cellPadding="0"
                        cellSpacing="0"
                        style={{ width: '100%' }}
                      >
                        <tr>
                          <td>
                            <div style={{ 
                              textAlign: 'center', 
                              marginBottom: '20px',
                              borderBottom: '1px solid #eee',
                              paddingBottom: '20px'
                            }}>
                              <h1 style={{ 
                                color: '#0070f3', 
                                fontSize: '24px', 
                                fontWeight: 'bold',
                                margin: 0,
                              }}>
                                DataCop
                              </h1>
                            </div>
                            {children}
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
                <div
                  style={{
                    clear: 'both',
                    marginTop: '10px',
                    textAlign: 'center',
                    width: '100%',
                    color: '#999999',
                    fontSize: '12px',
                  }}
                >
                  <table
                    role="presentation"
                    border={0}
                    cellPadding="0"
                    cellSpacing="0"
                    style={{ width: '100%' }}
                  >
                    <tr>
                      <td
                        style={{
                          paddingBottom: '10px',
                          paddingTop: '10px',
                          color: '#999999',
                          fontSize: '12px',
                          textAlign: 'center',
                        }}
                      >
                        <span
                          style={{
                            color: '#999999',
                            fontSize: '12px',
                            textAlign: 'center',
                          }}
                        >
                          &copy; {new Date().getFullYear()} DataCop. Tous droits réservés.
                        </span>
                      </td>
                    </tr>
                  </table>
                </div>
              </div>
            </td>
            <td>&nbsp;</td>
          </tr>
        </table>
      </body>
    </html>
  );
};

export const Button: React.FC<{
  href: string;
  children: React.ReactNode;
}> = ({ href, children }) => {
  return (
    <table
      role="presentation"
      border={0}
      cellPadding="0"
      cellSpacing="0"
      style={{
        width: '100%',
        marginBottom: '20px',
      }}
    >
      <tr>
        <td align="center">
          <table role="presentation" border={0} cellPadding="0" cellSpacing="0">
            <tr>
              <td>
                <a
                  href={href}
                  target="_blank"
                  style={{
                    backgroundColor: '#0070f3',
                    borderRadius: '5px',
                    color: '#ffffff',
                    cursor: 'pointer',
                    display: 'inline-block',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    margin: 0,
                    padding: '12px 25px',
                    textDecoration: 'none',
                    textTransform: 'capitalize',
                  }}
                >
                  {children}
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  );
};
