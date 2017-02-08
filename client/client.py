import cmd
import json
import re
import urllib2

QUEUE_JUMP = ' QUEUE JUMP'
API_PATH = 'http://localhost:5000/barcode/'

# http://stackoverflow.com/questions/287871/print-in-terminal-with-colors-using-python
class bcolors:
    HEADER = '\033[95m'
    OKBLUE = '\033[94m'
    OKGREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'

def print_help():
    print
    print 'Churchill Spring Ball - Admissions System'
    print
    print 'Please scan a barcode to proceed.'
    print

class Admissions(cmd.Cmd):
    def do_help(self, line):
        print_help()

    def emptyline(self):
        # Do nothing
        pass

    def default(self, line):
        line = line.strip()
        if not re.match('\d{13}$', line):
            self.error('No barcode detected')
            return

        checksum = int(line[-1:])
        barcode = line[0:12]

        if self.calculate_checksum(barcode) != checksum:
            self.error('Invalid barcode')
            return

        try:
            response = urllib2.urlopen('{}{}'.format(API_PATH, barcode))
            data = json.load(response)
        except Exception:
            # Catch all
            self.error('Unknown error occurred whilst loading API')
            return

        try:
            if 'error' in data.keys():
                self.error(data['message'])
                return

            print
            self.success('SUCCESS: Ticket admitted')
            self.success('DETAILS: {} ({}){}'.format(
                data['name'],
                data['crsid'],
                QUEUE_JUMP if data['queueJump'] else ''))
            print

        except KeyError:
            self.error('Unknown error occurred')

    def error(self, msg):
        print
        self.log(bcolors.FAIL + 'ERROR: ' + msg + bcolors.ENDC)
        print

    def success(self, msg):
        self.log(bcolors.OKGREEN + msg + bcolors.ENDC)

    def log(self, msg):
        print msg

    def calculate_checksum(self, code):
        """Calculates the checksum for EAN13-Code."""
        def sum_(x, y): return int(x) + int(y)
        evensum = reduce(sum_, code[::2])
        oddsum = reduce(sum_, code[1::2])
        return (10 - ((evensum + oddsum * 3) % 10)) % 10

if __name__ == '__main__':
    print_help()

    try:
        Admissions().cmdloop()
    except KeyboardInterrupt:
        # Die on interrupt
        pass
